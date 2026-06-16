"""
Aggregates all API v1 routers.
"""
from fastapi import APIRouter

from app.api.routes import (
    auth,
    documents,
    notes,
    summaries,
    flashcards,
    mcqs,
    study_guide,
    chat,
    search,
    analytics,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(notes.router)
api_router.include_router(summaries.router)
api_router.include_router(flashcards.router)
api_router.include_router(mcqs.router)
api_router.include_router(study_guide.router)
api_router.include_router(chat.router)
api_router.include_router(search.router)
api_router.include_router(analytics.router)
