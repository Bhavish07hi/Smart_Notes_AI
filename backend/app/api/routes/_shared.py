"""
Shared helpers used across content-generation route modules.
"""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentStatus
from app.repositories import document_repository
from app.services.document_pipeline import get_full_text


def get_processed_document(db: Session, document_id: uuid.UUID, user_id: uuid.UUID) -> Document:
    """Fetch a document owned by the user and ensure it has finished processing."""
    document = document_repository.get_by_id_for_user(db, document_id, user_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if document.status == DocumentStatus.PROCESSING or document.status == DocumentStatus.UPLOADED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is still being processed. Please try again shortly.",
        )
    if document.status == DocumentStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Document processing failed: {document.error_message}",
        )

    return document


def get_document_content(document: Document) -> str:
    try:
        return get_full_text(document)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
