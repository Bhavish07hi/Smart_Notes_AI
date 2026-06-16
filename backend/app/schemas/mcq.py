"""
Pydantic schemas for MCQs.
"""
import uuid
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field

from app.models.mcq import MCQDifficulty


class MCQGenerateRequest(BaseModel):
    count: Literal[10, 25, 50] = 10
    difficulty: Optional[MCQDifficulty] = None


class MCQOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    question: str
    options: dict[str, str]
    correct_option: str
    explanation: str
    topic: Optional[str] = None
    difficulty: MCQDifficulty
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


class MCQListResponse(BaseModel):
    total: int
    items: list[MCQOut]
