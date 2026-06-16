"""
Smart Notes Generator AI - FastAPI application entrypoint.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.router import api_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging_middleware import RequestLoggingMiddleware, register_exception_handlers

# Ensure all models are imported so Base.metadata is populated
import app.models  # noqa: F401


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Production-ready AI-powered learning platform for notes, flashcards, MCQs, summaries, and document chat.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom middleware
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # Exception handlers
    register_exception_handlers(app)

    # Routers
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "ok", "project": settings.PROJECT_NAME, "environment": settings.ENVIRONMENT}

    @app.on_event("startup")
    def on_startup():
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)
        # Auto-create tables in development. In production, use Alembic migrations.
        if settings.ENVIRONMENT == "development":
            Base.metadata.create_all(bind=engine)

    return app


app = create_app()
