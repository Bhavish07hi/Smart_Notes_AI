"""
Notes generation and retrieval routes.
"""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.routes._shared import get_processed_document, get_document_content
from app.core.database import get_db
from app.models.user import User
from app.models.analytics import EventType
from app.repositories import content_repository
from app.schemas.note import NoteGenerateRequest, NoteOut, NoteListResponse
from app.services import ai_generation
from app.services.analytics_service import log_event

router = APIRouter(prefix="/documents/{document_id}/notes", tags=["Notes"])


@router.post("/generate", response_model=NoteListResponse, status_code=status.HTTP_201_CREATED)
def generate_notes(
    document_id: uuid.UUID,
    request: NoteGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate structured study notes for a document.

    One Note record is created per requested note_type (detailed, concise,
    exam_revision, one_page, topic_wise).
    """
    document = get_processed_document(db, document_id, current_user.id)
    content = get_document_content(document)

    created_notes = []
    for idx, note_type in enumerate(request.note_types):
        generated = ai_generation.generate_notes(content, note_type)
        note = content_repository.create_note(db, document.id, generated, note_type, order_index=idx)
        created_notes.append(note)

    log_event(db, current_user.id, EventType.NOTES_GENERATED, meta=str(document.id))

    return NoteListResponse(total=len(created_notes), items=created_notes)


@router.get("", response_model=NoteListResponse)
def list_notes(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all generated notes for a document."""
    document = get_processed_document(db, document_id, current_user.id)
    items, total = content_repository.list_notes(db, document.id)
    return NoteListResponse(total=total, items=items)
