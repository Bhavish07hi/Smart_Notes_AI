"""
AI chat (RAG QA) routes - ask questions about an uploaded document.
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.routes._shared import get_processed_document
from app.core.database import get_db
from app.models.chat import ChatMessage
from app.models.user import User
from app.models.analytics import EventType
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse, ChatMessageOut
from app.services import rag
from app.services.analytics_service import log_event

router = APIRouter(prefix="/documents/{document_id}/chat", tags=["AI Chat"])


@router.post("", response_model=ChatResponse)
def ask_question(
    document_id: uuid.UUID,
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ask a question about an uploaded document.

    Performs semantic retrieval over the document's FAISS index, sends the
    retrieved chunks plus conversation history to the LLM, and returns the
    answer with source citations.
    """
    document = get_processed_document(db, document_id, current_user.id)

    _, assistant_message = rag.answer_question(
        db, current_user.id, document.id, request.question
    )

    log_event(db, current_user.id, EventType.CHAT_MESSAGE, meta=str(document.id))

    return ChatResponse(
        answer=assistant_message.content,
        sources=assistant_message.sources or [],
        message_id=assistant_message.id,
    )


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(
    document_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the conversation history for a document."""
    document = get_processed_document(db, document_id, current_user.id)

    query = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == document.id, ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at)
    )
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return ChatHistoryResponse(total=total, items=[ChatMessageOut.model_validate(i) for i in items])
