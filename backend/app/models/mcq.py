"""
MCQ model - multiple choice questions with options, answer & explanation.
"""
import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class MCQDifficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class MCQ(Base):
    __tablename__ = "mcqs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)

    question = Column(Text, nullable=False)
    options = Column(JSONB, nullable=False)  # {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_option = Column(String(1), nullable=False)  # "A" | "B" | "C" | "D"
    explanation = Column(Text, nullable=False)
    topic = Column(String(255), nullable=True, index=True)
    difficulty = Column(Enum(MCQDifficulty), default=MCQDifficulty.MEDIUM, nullable=False)
    order_index = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="mcqs")
