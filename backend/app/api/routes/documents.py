"""
Document upload, listing, status, and deletion routes.
"""
import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.document import DocumentType, DocumentStatus
from app.models.user import User
from app.models.analytics import EventType
from app.repositories import document_repository
from app.schemas.document import DocumentOut, DocumentListResponse, DocumentStatusResponse
from app.services import embeddings
from app.services.document_pipeline import process_document
from app.services.analytics_service import log_event

router = APIRouter(prefix="/documents", tags=["Documents"])

EXTENSION_TO_TYPE = {
    ".pdf": DocumentType.PDF,
    ".ppt": DocumentType.PPT,
    ".pptx": DocumentType.PPTX,
    ".docx": DocumentType.DOCX,
    ".txt": DocumentType.TXT,
}


def _validate_upload(file: UploadFile) -> str:
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {settings.ALLOWED_EXTENSIONS}",
        )
    return ext


@router.post("/upload", response_model=list[DocumentOut], status_code=status.HTTP_201_CREATED)
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload one or more documents (PDF, PPT, PPTX, DOCX, TXT).

    Files are validated, stored securely on disk, recorded in PostgreSQL,
    and queued for background processing (text extraction, chunking, embeddings).
    """
    created_documents = []
    user_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)

    for file in files:
        ext = _validate_upload(file)

        # Read and validate size
        contents = await file.read()
        size_bytes = len(contents)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if size_bytes > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' exceeds max size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
            )

        # Secure storage filename
        document_id = uuid.uuid4()
        stored_filename = f"{document_id}{ext}"
        file_path = os.path.join(user_dir, stored_filename)
        with open(file_path, "wb") as f:
            f.write(contents)

        document = document_repository.create_document(
            db,
            id=document_id,
            owner_id=current_user.id,
            filename=stored_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_type=EXTENSION_TO_TYPE[ext],
            file_size_bytes=size_bytes,
            status=DocumentStatus.UPLOADED,
        )

        log_event(db, current_user.id, EventType.DOCUMENT_UPLOADED, meta=file.filename)

        # Queue background processing
        background_tasks.add_task(_process_in_background, document.id)

        created_documents.append(document)

    return created_documents


def _process_in_background(document_id: uuid.UUID) -> None:
    """Run document processing in a fresh DB session (background task)."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        document = document_repository.get_by_id(db, document_id)
        if document:
            process_document(db, document)
    finally:
        db.close()


@router.get("", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all documents uploaded by the current user."""
    items, total = document_repository.list_for_user(db, current_user.id, skip, limit)
    return DocumentListResponse(total=total, items=items)


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details for a single document."""
    document = document_repository.get_by_id_for_user(db, document_id, current_user.id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return document


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Poll the processing status of a document."""
    document = document_repository.get_by_id_for_user(db, document_id, current_user.id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return DocumentStatusResponse(
        id=document.id,
        status=document.status,
        error_message=document.error_message,
        total_chunks=document.total_chunks,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document, its file, and its vector index."""
    document = document_repository.get_by_id_for_user(db, document_id, current_user.id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    if document.extracted_text_path and os.path.exists(document.extracted_text_path):
        os.remove(document.extracted_text_path)

    embeddings.delete_index(str(document.id))
    document_repository.delete_document(db, document)
    return None
