"""
Flashcard model with difficulty levels and review tracking.
"""
import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    topic = Column(String(255), nullable=True, index=True)
    difficulty = Column(
    Enum(
        DifficultyLevel,
        values_callable=lambda x: [e.value for e in x]
    ),
    default=DifficultyLevel.MEDIUM,
    nullable=False
    )
    review_count = Column(Integer, default=0)
    is_mastered = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="flashcards")
