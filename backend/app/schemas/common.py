"""
Pydantic schemas for search and analytics endpoints.
"""
import uuid
from typing import Optional, Literal

from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    mode: Literal["semantic", "keyword", "hybrid"] = "semantic"
    document_id: Optional[uuid.UUID] = None
    top_k: int = 5


class SearchResultItem(BaseModel):
    document_id: uuid.UUID
    document_name: str
    chunk_id: str
    content: str
    page_number: Optional[int] = None
    score: float


class SearchResponse(BaseModel):
    query: str
    mode: str
    total: int
    results: list[SearchResultItem]


class DashboardStats(BaseModel):
    total_documents: int
    total_notes: int
    total_flashcards: int
    total_mcqs: int
    total_summaries: int
    total_chats: int


class ActivityItem(BaseModel):
    event_type: str
    meta: Optional[str] = None
    created_at: str


class RecentActivityResponse(BaseModel):
    items: list[ActivityItem]


class AnalyticsTrendPoint(BaseModel):
    date: str
    count: int


class AnalyticsResponse(BaseModel):
    documents_uploaded: list[AnalyticsTrendPoint]
    notes_generated: list[AnalyticsTrendPoint]
    flashcards_created: list[AnalyticsTrendPoint]
    mcqs_generated: list[AnalyticsTrendPoint]
    chat_usage: list[AnalyticsTrendPoint]
    event_distribution: dict[str, int]
