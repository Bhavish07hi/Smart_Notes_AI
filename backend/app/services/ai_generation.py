"""
AI generation service.

Wraps the LLM client with the prompt templates to generate notes, flashcards,
MCQs, summaries, and study guides from document content.

To keep prompts within token limits, generation is performed over a
truncated/aggregated view of the document content (the first N characters of
the cleaned extracted text). For very large documents, content is chunked and
generation is run per-chunk-group, then results are merged.
"""
from app.models.note import NoteType
from app.models.flashcard import DifficultyLevel
from app.models.mcq import MCQDifficulty
from app.models.summary import SummaryLength
from app.services import prompts
from app.services.llm_client import generate_json

# Max characters of source content to send per generation call.
MAX_CONTENT_CHARS = 2000


def _truncate(content: str, max_chars: int = MAX_CONTENT_CHARS) -> str:
    if len(content) <= max_chars:
        return content
    return content[:max_chars] + "\n...[content truncated]..."


def generate_notes(content: str, note_type: NoteType) -> dict:
    """Generate a single notes document of the given type."""
    user_prompt = prompts.NOTES_USER_PROMPT_TEMPLATE.format(
        note_type=note_type.value,
        content=_truncate(content),
    )
    result = generate_json(prompts.NOTES_SYSTEM_PROMPT, user_prompt)
    return {
        "title": result.get("title", "Untitled Notes"),
        "topic": result.get("topic"),
        "chapter": result.get("chapter"),
        "content": result.get("content", ""),
    }


def generate_flashcards(content: str, count: int, difficulty: DifficultyLevel | None = None) -> list[dict]:
    """Generate `count` flashcards from content."""
    difficulty_instruction = (
        f"All flashcards should have difficulty '{difficulty.value}'."
        if difficulty
        else "Distribute difficulty evenly across easy, medium, and hard."
    )
    user_prompt = prompts.FLASHCARD_USER_PROMPT_TEMPLATE.format(
        count=count,
        difficulty_instruction=difficulty_instruction,
        content=_truncate(content),
    )
    result = generate_json(prompts.FLASHCARD_SYSTEM_PROMPT, user_prompt)
    flashcards = result.get("flashcards", [])
    return flashcards[:count]


def generate_mcqs(content: str, count: int, difficulty: MCQDifficulty | None = None) -> list[dict]:
    """Generate `count` MCQs from content."""
    difficulty_instruction = (
        f"All MCQs should have difficulty '{difficulty.value}'."
        if difficulty
        else "Distribute difficulty evenly across easy, medium, and hard."
    )
    user_prompt = prompts.MCQ_USER_PROMPT_TEMPLATE.format(
        count=count,
        difficulty_instruction=difficulty_instruction,
        content=_truncate(content),
    )
    result = generate_json(prompts.MCQ_SYSTEM_PROMPT, user_prompt)
    mcqs = result.get("mcqs", [])
    return mcqs[:count]


def generate_summary(content: str, length_type: SummaryLength, chapter: str | None = None) -> dict:
    """Generate a chapter/document summary at the given length."""
    length_guideline = prompts.SUMMARY_LENGTH_GUIDELINES[length_type.value]
    user_prompt = prompts.SUMMARY_USER_PROMPT_TEMPLATE.format(
        length_guideline=length_guideline,
        content=_truncate(content),
    )
    result = generate_json(prompts.SUMMARY_SYSTEM_PROMPT, user_prompt)
    if chapter:
        result["chapter"] = chapter
    return result


def generate_study_guide(content: str) -> dict:
    """Generate an exam preparation study guide."""
    user_prompt = prompts.STUDY_GUIDE_USER_PROMPT_TEMPLATE.format(content=_truncate(content))
    return generate_json(prompts.STUDY_GUIDE_SYSTEM_PROMPT, user_prompt)


def generate_rag_answer(context_chunks: list[dict], history: list[dict], question: str) -> dict:
    """
    Generate a RAG answer.

    context_chunks: list of {"chunk_id": str, "content": str, "page_number": int|None}
    history: list of {"role": "user"|"assistant", "content": str}
    """
    context_text = "\n\n".join(
        f"[chunk_id={c['chunk_id']}, page={c.get('page_number')}]\n{c['content']}"
        for c in context_chunks
    )
    history_text = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history[-6:]) or "(none)"

    user_prompt = prompts.RAG_USER_PROMPT_TEMPLATE.format(
        context=context_text or "(no relevant context found)",
        history=history_text,
        question=question,
    )
    return generate_json(prompts.RAG_SYSTEM_PROMPT, user_prompt, temperature=0.2)
