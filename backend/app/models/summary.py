"""
Summary model - chapter / document summaries at different lengths.
"""
import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class SummaryLength(str, enum.Enum):
    SHORT = "short"        # 100-200 words
    MEDIUM = "medium"      # 300-500 words
    DETAILED = "detailed"  # 1000+ words


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(512), nullable=False)
    chapter = Column(String(255), nullable=True)
    length_type = Column(Enum(SummaryLength), nullable=False, default=SummaryLength.MEDIUM)

    content = Column(Text, nullable=False)
    key_concepts = Column(Text, nullable=True)
    important_formulas = Column(Text, nullable=True)
    important_facts = Column(Text, nullable=True)
    exam_tips = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="summaries")
