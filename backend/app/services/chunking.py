"""
Text chunking service using LangChain's RecursiveCharacterTextSplitter.
"""
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.core.config import settings


def chunk_text(text: str) -> list[str]:
    """
    Split text into overlapping chunks suitable for embedding.

    Uses a recursive splitter that tries to break on paragraph/sentence
    boundaries first, falling back to smaller separators.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(text)
    return [c.strip() for c in chunks if c.strip()]


def extract_page_number(chunk: str) -> int | None:
    """Best-effort extraction of a page number marker (e.g. '[PAGE 3]') from a chunk."""
    import re

    match = re.search(r"\[PAGE (\d+)\]", chunk)
    if match:
        return int(match.group(1))
    return None
