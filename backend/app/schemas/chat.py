"""
Pydantic schemas for the AI chat / RAG QA module.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.chat import MessageRole


class ChatRequest(BaseModel):
    question: str


class SourceCitation(BaseModel):
    chunk_id: str
    content_snippet: str
    page_number: Optional[int] = None


class ChatMessageOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    role: MessageRole
    content: str
    sources: Optional[list[SourceCitation]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    total: int
    items: list[ChatMessageOut]


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceCitation]
    message_id: uuid.UUID
