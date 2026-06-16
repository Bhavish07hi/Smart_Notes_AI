"""
MCQ generation and retrieval routes.
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
from app.schemas.mcq import MCQGenerateRequest, MCQListResponse
from app.services import ai_generation
from app.services.analytics_service import log_event

router = APIRouter(prefix="/documents/{document_id}/mcqs", tags=["MCQs"])


@router.post("/generate", response_model=MCQListResponse, status_code=status.HTTP_201_CREATED)
def generate_mcqs(
    document_id: uuid.UUID,
    request: MCQGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate multiple choice questions for a document.

    `count` must be 10, 25, or 50. Each MCQ includes four options, the
    correct answer, and an explanation.
    """
    document = get_processed_document(db, document_id, current_user.id)
    content = get_document_content(document)

    generated = ai_generation.generate_mcqs(content, request.count, request.difficulty)
    mcqs = content_repository.bulk_create_mcqs(db, document.id, generated)

    log_event(db, current_user.id, EventType.MCQS_GENERATED, meta=str(document.id))

    return MCQListResponse(total=len(mcqs), items=mcqs)


@router.get("", response_model=MCQListResponse)
def list_mcqs(
    document_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List MCQs generated for a document."""
    document = get_processed_document(db, document_id, current_user.id)
    items, total = content_repository.list_mcqs(db, document.id, skip, limit)
    return MCQListResponse(total=total, items=items)
