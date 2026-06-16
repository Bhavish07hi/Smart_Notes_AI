"""
Repository for Document entity database operations.
"""
import uuid

from sqlalchemy.orm import Session

from app.models.document import Document


def create_document(db: Session, **kwargs) -> Document:
    document = Document(**kwargs)
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_by_id(db: Session, document_id: uuid.UUID) -> Document | None:
    return db.query(Document).filter(Document.id == document_id).first()


def get_by_id_for_user(db: Session, document_id: uuid.UUID, user_id: uuid.UUID) -> Document | None:
    return (
        db.query(Document)
        .filter(Document.id == document_id, Document.owner_id == user_id)
        .first()
    )


def list_for_user(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> tuple[list[Document], int]:
    query = db.query(Document).filter(Document.owner_id == user_id).order_by(Document.created_at.desc())
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total


def delete_document(db: Session, document: Document) -> None:
    db.delete(document)
    db.commit()
