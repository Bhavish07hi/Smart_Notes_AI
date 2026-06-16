"""
Flashcard generation, retrieval, and review routes.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.routes._shared import get_processed_document, get_document_content
from app.core.database import get_db
from app.models.user import User
from app.models.analytics import EventType
from app.repositories import content_repository
from app.schemas.flashcard import (
    FlashcardGenerateRequest,
    FlashcardOut,
    FlashcardListResponse,
    FlashcardReviewUpdate,
)
from app.services import ai_generation
from app.services.analytics_service import log_event

router = APIRouter(tags=["Flashcards"])


@router.post(
    "/documents/{document_id}/flashcards/generate",
    response_model=FlashcardListResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_flashcards(
    document_id: uuid.UUID,
    request: FlashcardGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate flashcards (question/answer pairs) for a document."""
    document = get_processed_document(db, document_id, current_user.id)
    content = get_document_content(document)

    generated = ai_generation.generate_flashcards(content, request.count, request.difficulty)
    flashcards = content_repository.bulk_create_flashcards(db, document.id, generated)

    log_event(db, current_user.id, EventType.FLASHCARDS_GENERATED, meta=str(document.id))

    return FlashcardListResponse(total=len(flashcards), items=flashcards)


@router.get("/documents/{document_id}/flashcards", response_model=FlashcardListResponse)
def list_flashcards(
    document_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List flashcards for a document (for the flip-card review UI)."""
    document = get_processed_document(db, document_id, current_user.id)
    items, total = content_repository.list_flashcards(db, document.id, skip, limit)
    return FlashcardListResponse(total=total, items=items)


@router.patch("/flashcards/{flashcard_id}/review", response_model=FlashcardOut)
def review_flashcard(
    flashcard_id: uuid.UUID,
    update: FlashcardReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a flashcard as reviewed, optionally setting its mastered status."""
    flashcard = content_repository.get_flashcard(db, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")

    # Ownership check via parent document
    document = flashcard.document
    if document.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    return content_repository.update_flashcard_review(db, flashcard, update.is_mastered)
