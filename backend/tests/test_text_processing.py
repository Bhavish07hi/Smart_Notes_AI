"""
Unit tests for text extraction cleaning and chunking utilities.
"""
from app.services.file_processing import clean_text
from app.services.chunking import chunk_text, extract_page_number


def test_clean_text_collapses_whitespace_and_blank_lines():
    raw = "Heading\n\n\n\nLine with   extra   spaces  \n\n\nAnother line"
    cleaned = clean_text(raw)

    assert "   " not in cleaned
    assert "\n\n\n" not in cleaned
    assert "Heading" in cleaned
    assert "Another line" in cleaned


def test_chunk_text_respects_overlap_and_size():
    text = "Sentence one. " * 200  # long repetitive text
    chunks = chunk_text(text)

    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) > 0


def test_extract_page_number_from_marker():
    chunk = "[PAGE 4]\nSome content about cell biology."
    assert extract_page_number(chunk) == 4


def test_extract_page_number_returns_none_when_absent():
    chunk = "Plain content with no page marker."
    assert extract_page_number(chunk) is None
