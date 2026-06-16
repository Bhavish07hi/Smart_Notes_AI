"""
Study guide generation route - exam preparation guide with revision plan.
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.api.routes._shared import get_processed_document, get_document_content
from app.core.database import get_db
from app.models.user import User
from app.services import ai_generation

router = APIRouter(prefix="/documents/{document_id}/study-guide", tags=["Study Guide"])


class StudyGuideResponse(BaseModel):
    important_topics: list[str]
    weak_areas: list[str]
    recommended_revision_order: list[str]
    last_minute_revision_sheet: str
    quick_facts_sheet: str


@router.post("/generate", response_model=StudyGuideResponse)
def generate_study_guide(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate an exam preparation study guide for a document, including
    important topics, weak areas, a recommended revision order, a
    last-minute revision sheet, and a quick facts sheet.
    """
    document = get_processed_document(db, document_id, current_user.id)
    content = get_document_content(document)

    result = ai_generation.generate_study_guide(content)
    return StudyGuideResponse(
        important_topics=result.get("important_topics", []),
        weak_areas=result.get("weak_areas", []),
        recommended_revision_order=result.get("recommended_revision_order", []),
        last_minute_revision_sheet=result.get("last_minute_revision_sheet", ""),
        quick_facts_sheet=result.get("quick_facts_sheet", ""),
    )
