"""
Import all models here so that Base.metadata is aware of them
(needed for Alembic autogenerate and create_all).
"""
from app.models.user import User, UserRole  # noqa
from app.models.document import Document, DocumentStatus, DocumentType  # noqa
from app.models.note import Note, NoteType  # noqa
from app.models.summary import Summary, SummaryLength  # noqa
from app.models.flashcard import Flashcard, DifficultyLevel  # noqa
from app.models.mcq import MCQ, MCQDifficulty  # noqa
from app.models.embedding import EmbeddingChunk  # noqa
from app.models.chat import ChatMessage, MessageRole  # noqa
from app.models.analytics import AnalyticsEvent, EventType  # noqa
