"""
Search routes - semantic, keyword, and hybrid search across user documents.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.analytics import EventType
from app.schemas.common import SearchRequest, SearchResponse, SearchResultItem
from app.services import search as search_service
from app.services.analytics_service import log_event

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
def search_documents(
    request: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search across the current user's documents.

    - `semantic`: vector similarity search via FAISS
    - `keyword`: SQL ILIKE substring search
    - `hybrid`: combination of both, deduplicated and ranked
    """
    results = search_service.search(
        db, current_user.id, request.query, request.mode, request.document_id, request.top_k
    )

    log_event(db, current_user.id, EventType.SEARCH_QUERY, meta=request.query[:255])

    return SearchResponse(
        query=request.query,
        mode=request.mode,
        total=len(results),
        results=[SearchResultItem(**r) for r in results],
    )
