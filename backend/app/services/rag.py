"""
RAG retrieval service.

Combines FAISS similarity search with EmbeddingChunk metadata to produce
context chunks for the LLM, and orchestrates the full RAG QA flow.
"""
import uuid

from sqlalchemy.orm import Session

from app.models.embedding import EmbeddingChunk
from app.models.chat import ChatMessage, MessageRole
from app.services import embeddings, ai_generation


def retrieve_chunks(db: Session, document_id: uuid.UUID, query: str, top_k: int = 5) -> list[dict]:
    """Retrieve the most relevant chunks for a query from a document's FAISS index."""
    hits = embeddings.search_index(str(document_id), query, top_k=top_k)
    if not hits:
        return []

    faiss_ids = [faiss_id for faiss_id, _ in hits]
    score_by_faiss_id = {faiss_id: score for faiss_id, score in hits}

    chunks = (
        db.query(EmbeddingChunk)
        .filter(
            EmbeddingChunk.document_id == document_id,
            EmbeddingChunk.faiss_id.in_(faiss_ids),
        )
        .all()
    )

    results = []
    for chunk in chunks:
        results.append(
            {
                "chunk_id": str(chunk.id),
                "content": chunk.content,
                "page_number": chunk.page_number,
                "score": score_by_faiss_id.get(chunk.faiss_id, 0.0),
            }
        )

    results.sort(key=lambda r: r["score"], reverse=True)
    return results


def answer_question(
    db: Session,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    question: str,
    top_k: int = 5,
) -> tuple[ChatMessage, ChatMessage]:
    """
    Full RAG QA flow:
    1. Save user message.
    2. Retrieve relevant chunks.
    3. Build conversation history.
    4. Call LLM for an answer + cited chunks.
    5. Save and return assistant message with sources.
    """
    # 1. Save user message
    user_message = ChatMessage(
        user_id=user_id,
        document_id=document_id,
        role=MessageRole.USER,
        content=question,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # 2. Retrieve context
    context_chunks = retrieve_chunks(db, document_id, question, top_k=top_k)

    # 3. Conversation history (excluding the message just added)
    history_rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == document_id, ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(13)
        .all()
    )
    history_rows = list(reversed(history_rows))[:-1]  # drop the just-added message, chronological order
    history = [{"role": m.role.value, "content": m.content} for m in history_rows]

    # 4. LLM call
    result = ai_generation.generate_rag_answer(context_chunks, history, question)
    answer = result.get("answer", "I'm not sure based on the document content.")
    used_ids = set(result.get("used_chunk_ids", []))

    sources = [
        {
            "chunk_id": c["chunk_id"],
            "content_snippet": c["content"][:300],
            "page_number": c["page_number"],
        }
        for c in context_chunks
        if not used_ids or c["chunk_id"] in used_ids
    ]
    if not sources:
        sources = [
            {
                "chunk_id": c["chunk_id"],
                "content_snippet": c["content"][:300],
                "page_number": c["page_number"],
            }
            for c in context_chunks
        ]

    # 5. Save assistant message
    assistant_message = ChatMessage(
        user_id=user_id,
        document_id=document_id,
        role=MessageRole.ASSISTANT,
        content=answer,
        sources=sources,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return user_message, assistant_message
