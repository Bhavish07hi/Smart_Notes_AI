"""
Document model representing an uploaded file and its processing status.
"""
import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class DocumentType(str, enum.Enum):
    PDF = "pdf"
    PPT = "ppt"
    PPTX = "pptx"
    DOCX = "docx"
    TXT = "txt"


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    filename = Column(String(512), nullable=False)
    original_filename = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=False)

    file_type = Column(
        Enum(
            DocumentType,
            values_callable=lambda x: [e.value for e in x]
        ),
        nullable=False
    )

    file_size_bytes = Column(Integer, nullable=False)

    status = Column(
        Enum(
            DocumentStatus,
            values_callable=lambda x: [e.value for e in x]
        ),
        default=DocumentStatus.UPLOADED,
        nullable=False,
        index=True
    )

    error_message = Column(Text, nullable=True)

    extracted_text_path = Column(String(1024), nullable=True)
    total_chunks = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="documents")
    notes = relationship("Note", back_populates="document", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="document", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="document", cascade="all, delete-orphan")
    mcqs = relationship("MCQ", back_populates="document", cascade="all, delete-orphan")
    embeddings = relationship("EmbeddingChunk", back_populates="document", cascade="all, delete-orphan")
    chats = relationship("ChatMessage", back_populates="document", cascade="all, delete-orphan")