"""
Document processing pipeline.

Given an uploaded Document record, this:
1. Extracts text using the appropriate extractor.
2. Cleans the text.
3. Chunks it (recursive splitter with overlap).
4. Generates embeddings and stores them in FAISS.
5. Persists EmbeddingChunk rows linking text + faiss ids.
6. Updates the Document status.
"""
import logging
import os

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document, DocumentStatus
from app.models.embedding import EmbeddingChunk
from app.services import file_processing, chunking, embeddings

logger = logging.getLogger(__name__)


def process_document(db: Session, document: Document) -> None:
    """Run the full processing pipeline for a document. Updates `document` in place."""
    try:
        document.status = DocumentStatus.PROCESSING
        db.add(document)
        db.commit()

        # 1. Extract
        raw_text = file_processing.extract_text(document.file_path)

        # 2. Persist extracted text
        extracted_path = os.path.join(
            os.path.dirname(document.file_path), f"{document.id}.extracted.txt"
        )
        file_processing.save_extracted_text(raw_text, extracted_path)
        document.extracted_text_path = extracted_path

        # 3. Chunk
        chunks = chunking.chunk_text(raw_text)
        if not chunks:
            raise ValueError("No extractable text content found in document.")

        # 4 & 5. Embed + store in FAISS, persist EmbeddingChunk rows
        faiss_ids = embeddings.add_chunks_to_index(str(document.id), chunks, start_id=0)
        for idx, (chunk_text_, faiss_id) in enumerate(zip(chunks, faiss_ids)):
            page_number = chunking.extract_page_number(chunk_text_)
            db.add(
                EmbeddingChunk(
                    document_id=document.id,
                    chunk_index=idx,
                    faiss_id=faiss_id,
                    content=chunk_text_,
                    page_number=page_number,
                )
            )

        document.total_chunks = len(chunks)
        document.status = DocumentStatus.PROCESSED
        document.error_message = None
        db.add(document)
        db.commit()

    except Exception as exc:  # noqa: BLE001
        logger.exception("Document processing failed for %s", document.id)
        document.status = DocumentStatus.FAILED
        document.error_message = str(exc)
        db.add(document)
        db.commit()


def get_full_text(document: Document) -> str:
    """Read the full extracted text for a processed document."""
    if not document.extracted_text_path or not os.path.exists(document.extracted_text_path):
        raise FileNotFoundError("Extracted text not available for this document.")
    with open(document.extracted_text_path, "r", encoding="utf-8") as f:
        return f.read()
