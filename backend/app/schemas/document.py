"""
Pydantic schemas for documents and upload responses.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.document import DocumentStatus, DocumentType


class DocumentOut(BaseModel):
    id: uuid.UUID
    filename: str
    original_filename: str
    file_type: DocumentType
    file_size_bytes: int
    status: DocumentStatus
    error_message: Optional[str] = None
    total_chunks: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    total: int
    items: list[DocumentOut]


class DocumentStatusResponse(BaseModel):
    id: uuid.UUID
    status: DocumentStatus
    error_message: Optional[str] = None
    total_chunks: int
