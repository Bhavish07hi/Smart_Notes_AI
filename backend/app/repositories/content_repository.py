"""
Repositories for generated content: notes, summaries, flashcards, MCQs.
"""
import uuid

from sqlalchemy.orm import Session

from app.models.note import Note, NoteType
from app.models.summary import Summary, SummaryLength
from app.models.flashcard import Flashcard, DifficultyLevel
from app.models.mcq import MCQ, MCQDifficulty


# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------

def create_note(db: Session, document_id: uuid.UUID, data: dict, note_type: NoteType, order_index: int = 0) -> Note:
    note = Note(
        document_id=document_id,
        title=data.get("title", "Untitled Notes"),
        topic=data.get("topic"),
        chapter=data.get("chapter"),
        note_type=note_type.value,  
        content=data.get("content", ""),
        order_index=order_index,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def list_notes(db: Session, document_id: uuid.UUID) -> tuple[list[Note], int]:
    query = db.query(Note).filter(Note.document_id == document_id).order_by(Note.order_index, Note.created_at)
    return query.all(), query.count()


# ---------------------------------------------------------------------------
# Summaries
# ---------------------------------------------------------------------------

def create_summary(db: Session, document_id: uuid.UUID, data: dict, length_type: SummaryLength) -> Summary:
    summary = Summary(
        document_id=document_id,
        title=data.get("title", "Untitled Summary"),
        chapter=data.get("chapter"),
        length_type=length_type.value,
        content=data.get("content", ""),
        key_concepts=data.get("key_concepts"),
        important_formulas=data.get("important_formulas"),
        important_facts=data.get("important_facts"),
        exam_tips=data.get("exam_tips"),
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


def list_summaries(db: Session, document_id: uuid.UUID) -> tuple[list[Summary], int]:
    query = db.query(Summary).filter(Summary.document_id == document_id).order_by(Summary.created_at.desc())
    return query.all(), query.count()


# ---------------------------------------------------------------------------
# Flashcards
# ---------------------------------------------------------------------------

def bulk_create_flashcards(db: Session, document_id: uuid.UUID, items: list[dict]) -> list[Flashcard]:
    flashcards = []
    for item in items:
        try:
            difficulty = DifficultyLevel(item.get("difficulty", "medium"))
        except ValueError:
            difficulty = DifficultyLevel.MEDIUM
        flashcards.append(
            Flashcard(
                document_id=document_id,
                question=item.get("question", ""),
                answer=item.get("answer", ""),
                topic=item.get("topic"),
                difficulty=difficulty.value,
            )
        )
    db.add_all(flashcards)
    db.commit()
    for f in flashcards:
        db.refresh(f)
    return flashcards


def list_flashcards(db: Session, document_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[list[Flashcard], int]:
    query = db.query(Flashcard).filter(Flashcard.document_id == document_id).order_by(Flashcard.created_at)
    total = query.count()
    return query.offset(skip).limit(limit).all(), total


def get_flashcard(db: Session, flashcard_id: uuid.UUID) -> Flashcard | None:
    return db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()


def update_flashcard_review(db: Session, flashcard: Flashcard, is_mastered: bool | None) -> Flashcard:
    flashcard.review_count += 1
    if is_mastered is not None:
        flashcard.is_mastered = is_mastered
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    return flashcard


# ---------------------------------------------------------------------------
# MCQs
# ---------------------------------------------------------------------------

def bulk_create_mcqs(db: Session, document_id: uuid.UUID, items: list[dict]) -> list[MCQ]:
    mcqs = []
    for idx, item in enumerate(items):
        try:
            difficulty = MCQDifficulty(item.get("difficulty", "medium"))
        except ValueError:
            difficulty = MCQDifficulty.MEDIUM
        mcqs.append(
            MCQ(
                document_id=document_id,
                question=item.get("question", ""),
                options=item.get("options", {}),
                correct_option=item.get("correct_option", "A"),
                explanation=item.get("explanation", ""),
                topic=item.get("topic"),
                difficulty=difficulty.value,
                order_index=idx,
            )
        )
    db.add_all(mcqs)
    db.commit()
    for m in mcqs:
        db.refresh(m)
    return mcqs


def list_mcqs(db: Session, document_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[list[MCQ], int]:
    query = db.query(MCQ).filter(MCQ.document_id == document_id).order_by(MCQ.order_index)
    total = query.count()
    return query.offset(skip).limit(limit).all(), total
