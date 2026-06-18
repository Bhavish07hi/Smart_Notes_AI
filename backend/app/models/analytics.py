"""
AnalyticsEvent model - tracks user activity for the analytics dashboard.
"""
import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class EventType(str, enum.Enum):
    DOCUMENT_UPLOADED = "document_uploaded"
    NOTES_GENERATED = "notes_generated"
    FLASHCARDS_GENERATED = "flashcards_generated"
    MCQS_GENERATED = "mcqs_generated"
    SUMMARY_GENERATED = "summary_generated"
    CHAT_MESSAGE = "chat_message"
    SEARCH_QUERY = "search_query"
    LOGIN = "login"


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type = Column(
        Enum(
            EventType,
            values_callable=lambda x: [e.value for e in x]
        ),
        nullable=False,
        index=True
    )
    
    meta = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User")