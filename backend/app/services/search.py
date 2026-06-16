"""
Search service.

Supports:
- semantic: FAISS vector similarity search across a document (or all of a user's documents)
- keyword: SQL ILIKE search over EmbeddingChunk content
- hybrid: union of both, deduplicated, sorted by score
"""
import uuid

from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.embedding import EmbeddingChunk
from app.services import embeddings


def _document_ids_for_user(db: Session, user_id: uuid.UUID, document_id: uuid.UUID | None) -> list[uuid.UUID]:
    if document_id:
        return [document_id]
    rows = db.query(Document.id).filter(Document.owner_id == user_id).all()
    return [r[0] for r in rows]


def semantic_search(db: Session, user_id: uuid.UUID, query: str, document_id: uuid.UUID | None, top_k: int) -> list[dict]:
    results = []
    doc_ids = _document_ids_for_user(db, user_id, document_id)

    for doc_id in doc_ids:
        hits = embeddings.search_index(str(doc_id), query, top_k=top_k)
        if not hits:
            continue
        faiss_ids = [h[0] for h in hits]
        score_by_id = dict(hits)
        chunks = (
            db.query(EmbeddingChunk)
            .filter(EmbeddingChunk.document_id == doc_id, EmbeddingChunk.faiss_id.in_(faiss_ids))
            .all()
        )
        document = db.query(Document).get(doc_id)
        for chunk in chunks:
            results.append(
                {
                    "document_id": doc_id,
                    "document_name": document.original_filename if document else "",
                    "chunk_id": str(chunk.id),
                    "content": chunk.content,
                    "page_number": chunk.page_number,
                    "score": score_by_id.get(chunk.faiss_id, 0.0),
                }
            )

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:top_k]


def keyword_search(db: Session, user_id: uuid.UUID, query: str, document_id: uuid.UUID | None, top_k: int) -> list[dict]:
    doc_ids = _document_ids_for_user(db, user_id, document_id)
    if not doc_ids:
        return []

    rows = (
        db.query(EmbeddingChunk, Document)
        .join(Document, Document.id == EmbeddingChunk.document_id)
        .filter(EmbeddingChunk.document_id.in_(doc_ids))
        .filter(EmbeddingChunk.content.ilike(f"%{query}%"))
        .limit(top_k)
        .all()
    )

    results = []
    for chunk, document in rows:
        results.append(
            {
                "document_id": chunk.document_id,
                "document_name": document.original_filename,
                "chunk_id": str(chunk.id),
                "content": chunk.content,
                "page_number": chunk.page_number,
                "score": 1.0,  # keyword matches are unscored; treat as exact
            }
        )
    return results


def search(db: Session, user_id: uuid.UUID, query: str, mode: str, document_id: uuid.UUID | None, top_k: int) -> list[dict]:
    if mode == "semantic":
        return semantic_search(db, user_id, query, document_id, top_k)
    if mode == "keyword":
        return keyword_search(db, user_id, query, document_id, top_k)

    # hybrid
    semantic_results = semantic_search(db, user_id, query, document_id, top_k)
    keyword_results = keyword_search(db, user_id, query, document_id, top_k)

    seen_chunk_ids = set()
    combined = []
    for r in semantic_results + keyword_results:
        if r["chunk_id"] in seen_chunk_ids:
            continue
        seen_chunk_ids.add(r["chunk_id"])
        combined.append(r)

    combined.sort(key=lambda r: r["score"], reverse=True)
    return combined[:top_k]
