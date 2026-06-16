-- =============================================================================
-- Smart Notes Generator AI - PostgreSQL Schema
-- This schema is created automatically by SQLAlchemy in development.
-- This file is provided for reference, manual setup, and production migrations.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS
-- =============================================================================
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'student',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP
);

CREATE INDEX idx_users_email ON users (email);

-- =============================================================================
-- DOCUMENTS
-- =============================================================================
CREATE TYPE document_status AS ENUM ('uploaded', 'processing', 'processed', 'failed');
CREATE TYPE document_type AS ENUM ('pdf', 'ppt', 'pptx', 'docx', 'txt');

CREATE TABLE documents (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename             VARCHAR(512) NOT NULL,
    original_filename    VARCHAR(512) NOT NULL,
    file_path            VARCHAR(1024) NOT NULL,
    file_type            document_type NOT NULL,
    file_size_bytes      INTEGER NOT NULL CHECK (file_size_bytes > 0),
    status               document_status NOT NULL DEFAULT 'uploaded',
    error_message        TEXT,
    extracted_text_path  VARCHAR(1024),
    total_chunks         INTEGER NOT NULL DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP
);

CREATE INDEX idx_documents_owner_id ON documents (owner_id);
CREATE INDEX idx_documents_status ON documents (status);

-- =============================================================================
-- NOTES
-- =============================================================================
CREATE TYPE note_type AS ENUM ('detailed', 'concise', 'exam_revision', 'one_page', 'topic_wise');

CREATE TABLE notes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title       VARCHAR(512) NOT NULL,
    topic       VARCHAR(255),
    chapter     VARCHAR(255),
    note_type   note_type NOT NULL DEFAULT 'detailed',
    content     TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_document_id ON notes (document_id);
CREATE INDEX idx_notes_topic ON notes (topic);

-- =============================================================================
-- SUMMARIES
-- =============================================================================
CREATE TYPE summary_length AS ENUM ('short', 'medium', 'detailed');

CREATE TABLE summaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title               VARCHAR(512) NOT NULL,
    chapter             VARCHAR(255),
    length_type         summary_length NOT NULL DEFAULT 'medium',
    content             TEXT NOT NULL,
    key_concepts        TEXT,
    important_formulas  TEXT,
    important_facts     TEXT,
    exam_tips           TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_summaries_document_id ON summaries (document_id);

-- =============================================================================
-- FLASHCARDS
-- =============================================================================
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE flashcards (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    question      TEXT NOT NULL,
    answer        TEXT NOT NULL,
    topic         VARCHAR(255),
    difficulty    difficulty_level NOT NULL DEFAULT 'medium',
    review_count  INTEGER NOT NULL DEFAULT 0,
    is_mastered   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_flashcards_document_id ON flashcards (document_id);
CREATE INDEX idx_flashcards_topic ON flashcards (topic);

-- =============================================================================
-- MCQS
-- =============================================================================
CREATE TYPE mcq_difficulty AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE mcqs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    question        TEXT NOT NULL,
    options         JSONB NOT NULL,
    correct_option  CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation     TEXT NOT NULL,
    topic           VARCHAR(255),
    difficulty      mcq_difficulty NOT NULL DEFAULT 'medium',
    order_index     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_mcqs_document_id ON mcqs (document_id);
CREATE INDEX idx_mcqs_topic ON mcqs (topic);

-- =============================================================================
-- EMBEDDINGS (chunk metadata; vectors live in FAISS on disk)
-- =============================================================================
CREATE TABLE embeddings (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index  INTEGER NOT NULL,
    faiss_id     INTEGER NOT NULL,
    content      TEXT NOT NULL,
    page_number  INTEGER,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_embeddings_document_faiss UNIQUE (document_id, faiss_id)
);

CREATE INDEX idx_embeddings_document_id ON embeddings (document_id);
CREATE INDEX idx_embeddings_faiss_id ON embeddings (faiss_id);

-- =============================================================================
-- CHATS (RAG conversation history)
-- =============================================================================
CREATE TYPE message_role AS ENUM ('user', 'assistant');

CREATE TABLE chats (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    role         message_role NOT NULL,
    content      TEXT NOT NULL,
    sources      JSONB,
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_chats_user_id ON chats (user_id);
CREATE INDEX idx_chats_document_id ON chats (document_id);

-- =============================================================================
-- ANALYTICS EVENTS
-- =============================================================================
CREATE TYPE event_type AS ENUM (
    'document_uploaded',
    'notes_generated',
    'flashcards_generated',
    'mcqs_generated',
    'summary_generated',
    'chat_message',
    'search_query',
    'login'
);

CREATE TABLE analytics_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  event_type NOT NULL,
    meta        VARCHAR(512),
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events (user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events (event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events (created_at);
