"""
Embedding generation (Sentence Transformers) and FAISS vector store management.

Each document gets its own FAISS index file on disk:
    storage/faiss_index/<document_id>.index

A global in-memory cache avoids reloading indexes on every request.
"""
import os
import threading
from typing import Optional

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings

_model_lock = threading.Lock()
_model: Optional[SentenceTransformer] = None

_index_cache: dict[str, faiss.Index] = {}
_index_lock = threading.Lock()


def get_embedding_model() -> SentenceTransformer:
    """Lazily load and cache the sentence-transformers model (singleton)."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


def embed_texts(texts: list[str]) -> np.ndarray:
    """Embed a list of texts -> normalized float32 numpy array (N, dim)."""
    model = get_embedding_model()
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    return embeddings.astype("float32")


def _index_path(document_id: str) -> str:
    return os.path.join(settings.FAISS_INDEX_DIR, f"{document_id}.index")


def _new_index() -> faiss.Index:
    # Inner product on normalized vectors == cosine similarity
    return faiss.IndexIDMap(faiss.IndexFlatIP(settings.EMBEDDING_DIM))


def load_index(document_id: str) -> faiss.Index:
    """Load (or create) the FAISS index for a document, cached in memory."""
    with _index_lock:
        if document_id in _index_cache:
            return _index_cache[document_id]

        path = _index_path(document_id)
        if os.path.exists(path):
            index = faiss.read_index(path)
        else:
            index = _new_index()

        _index_cache[document_id] = index
        return index


def save_index(document_id: str) -> None:
    os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)
    index = _index_cache.get(document_id)
    if index is not None:
        faiss.write_index(index, _index_path(document_id))


def add_chunks_to_index(document_id: str, chunks: list[str], start_id: int = 0) -> list[int]:
    """
    Embed chunks and add them to the document's FAISS index.

    Returns the list of FAISS ids assigned to each chunk (sequential
    starting from `start_id`).
    """
    if not chunks:
        return []

    vectors = embed_texts(chunks)
    ids = np.arange(start_id, start_id + len(chunks)).astype("int64")

    index = load_index(document_id)
    index.add_with_ids(vectors, ids)
    save_index(document_id)

    return ids.tolist()


def search_index(document_id: str, query: str, top_k: int = 5) -> list[tuple[int, float]]:
    """Search a document's FAISS index. Returns [(faiss_id, score), ...]."""
    index = load_index(document_id)
    if index.ntotal == 0:
        return []

    query_vec = embed_texts([query])
    scores, ids = index.search(query_vec, min(top_k, index.ntotal))

    results = []
    for faiss_id, score in zip(ids[0], scores[0]):
        if faiss_id == -1:
            continue
        results.append((int(faiss_id), float(score)))
    return results


def delete_index(document_id: str) -> None:
    """Remove a document's index from disk and cache."""
    with _index_lock:
        _index_cache.pop(document_id, None)
    path = _index_path(document_id)
    if os.path.exists(path):
        os.remove(path)
