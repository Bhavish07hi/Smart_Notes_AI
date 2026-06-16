"""
Pydantic schemas for flashcards.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.flashcard import DifficultyLevel


class FlashcardGenerateRequest(BaseModel):
    count: int = Field(default=10, ge=1, le=100)
    difficulty: Optional[DifficultyLevel] = None


class FlashcardOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    question: str
    answer: str
    topic: Optional[str] = None
    difficulty: DifficultyLevel
    review_count: int
    is_mastered: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FlashcardListResponse(BaseModel):
    total: int
    items: list[FlashcardOut]


class FlashcardReviewUpdate(BaseModel):
    is_mastered: Optional[bool] = None
