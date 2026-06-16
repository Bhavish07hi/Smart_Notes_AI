"""
Pydantic schemas for chapter/document summaries.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.summary import SummaryLength


class SummaryGenerateRequest(BaseModel):
    length_type: SummaryLength = SummaryLength.MEDIUM
    chapter: Optional[str] = None


class SummaryOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    title: str
    chapter: Optional[str] = None
    length_type: SummaryLength
    content: str
    key_concepts: Optional[str] = None
    important_formulas: Optional[str] = None
    important_facts: Optional[str] = None
    exam_tips: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SummaryListResponse(BaseModel):
    total: int
    items: list[SummaryOut]
