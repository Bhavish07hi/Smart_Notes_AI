"""
Note model - stores generated study notes grouped by topic/chapter.
"""
import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class NoteType(str, enum.Enum):
    DETAILED = "detailed"
    CONCISE = "concise"
    EXAM_REVISION = "exam_revision"
    ONE_PAGE = "one_page"
    TOPIC_WISE = "topic_wise"


class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(512), nullable=False)
    topic = Column(String(255), nullable=True, index=True)
    chapter = Column(String(255), nullable=True)
    note_type = Column(Enum(NoteType), nullable=False, default=NoteType.DETAILED)
    content = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="notes")
