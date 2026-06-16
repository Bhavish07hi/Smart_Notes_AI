"""
Analytics service - aggregates data for the dashboard and analytics pages.
"""
import uuid
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.note import Note
from app.models.summary import Summary
from app.models.flashcard import Flashcard
from app.models.mcq import MCQ
from app.models.chat import ChatMessage, MessageRole
from app.models.analytics import AnalyticsEvent, EventType


def log_event(db: Session, user_id: uuid.UUID, event_type: EventType, meta: str | None = None) -> None:
    db.add(AnalyticsEvent(user_id=user_id, event_type=event_type, meta=meta))
    db.commit()


def get_dashboard_stats(db: Session, user_id: uuid.UUID) -> dict:
    doc_ids_subq = db.query(Document.id).filter(Document.owner_id == user_id).subquery()

    total_documents = db.query(func.count(Document.id)).filter(Document.owner_id == user_id).scalar() or 0
    total_notes = db.query(func.count(Note.id)).filter(Note.document_id.in_(doc_ids_subq)).scalar() or 0
    total_flashcards = db.query(func.count(Flashcard.id)).filter(Flashcard.document_id.in_(doc_ids_subq)).scalar() or 0
    total_mcqs = db.query(func.count(MCQ.id)).filter(MCQ.document_id.in_(doc_ids_subq)).scalar() or 0
    total_summaries = db.query(func.count(Summary.id)).filter(Summary.document_id.in_(doc_ids_subq)).scalar() or 0
    total_chats = (
        db.query(func.count(ChatMessage.id))
        .filter(ChatMessage.user_id == user_id, ChatMessage.role == MessageRole.USER)
        .scalar()
        or 0
    )

    return {
        "total_documents": total_documents,
        "total_notes": total_notes,
        "total_flashcards": total_flashcards,
        "total_mcqs": total_mcqs,
        "total_summaries": total_summaries,
        "total_chats": total_chats,
    }


def get_recent_activity(db: Session, user_id: uuid.UUID, limit: int = 20) -> list[dict]:
    rows = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.user_id == user_id)
        .order_by(AnalyticsEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "event_type": row.event_type.value,
            "meta": row.meta,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


def _daily_trend(db: Session, user_id: uuid.UUID, event_type: EventType, days: int = 30) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(func.date(AnalyticsEvent.created_at).label("day"), func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.user_id == user_id,
            AnalyticsEvent.event_type == event_type,
            AnalyticsEvent.created_at >= since,
        )
        .group_by("day")
        .order_by("day")
        .all()
    )
    return [{"date": str(day), "count": count} for day, count in rows]


def get_analytics(db: Session, user_id: uuid.UUID) -> dict:
    event_counts = (
        db.query(AnalyticsEvent.event_type, func.count(AnalyticsEvent.id))
        .filter(AnalyticsEvent.user_id == user_id)
        .group_by(AnalyticsEvent.event_type)
        .all()
    )
    event_distribution = {event_type.value: count for event_type, count in event_counts}

    return {
        "documents_uploaded": _daily_trend(db, user_id, EventType.DOCUMENT_UPLOADED),
        "notes_generated": _daily_trend(db, user_id, EventType.NOTES_GENERATED),
        "flashcards_created": _daily_trend(db, user_id, EventType.FLASHCARDS_GENERATED),
        "mcqs_generated": _daily_trend(db, user_id, EventType.MCQS_GENERATED),
        "chat_usage": _daily_trend(db, user_id, EventType.CHAT_MESSAGE),
        "event_distribution": event_distribution,
    }
