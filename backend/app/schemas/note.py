"""
Pydantic schemas for notes.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.note import NoteType


class NoteGenerateRequest(BaseModel):
    note_types: list[NoteType] = Field(
        default_factory=lambda: [NoteType.DETAILED, NoteType.CONCISE]
    )


class NoteOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    title: str
    topic: Optional[str] = None
    chapter: Optional[str] = None
    note_type: NoteType
    content: str
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    total: int
    items: list[NoteOut]
