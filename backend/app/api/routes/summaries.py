"""
Chapter/document summary generation and retrieval routes.
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
from app.schemas.summary import SummaryGenerateRequest, SummaryOut, SummaryListResponse
from app.services import ai_generation
from app.services.analytics_service import log_event

router = APIRouter(prefix="/documents/{document_id}/summaries", tags=["Summaries"])


@router.post("/generate", response_model=SummaryOut, status_code=status.HTTP_201_CREATED)
def generate_summary(
    document_id: uuid.UUID,
    request: SummaryGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a chapter/document summary at the requested length (short, medium, detailed)."""
    document = get_processed_document(db, document_id, current_user.id)
    content = get_document_content(document)

    generated = ai_generation.generate_summary(content, request.length_type, request.chapter)
    summary = content_repository.create_summary(db, document.id, generated, request.length_type)

    log_event(db, current_user.id, EventType.SUMMARY_GENERATED, meta=str(document.id))

    return summary


@router.get("", response_model=SummaryListResponse)
def list_summaries(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all generated summaries for a document."""
    document = get_processed_document(db, document_id, current_user.id)
    items, total = content_repository.list_summaries(db, document.id)
    return SummaryListResponse(total=total, items=items)
