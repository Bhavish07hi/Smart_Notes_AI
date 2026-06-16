// =============================================================================
// Shared TypeScript types mirroring backend Pydantic schemas.
// =============================================================================

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type DocumentStatus = "uploaded" | "processing" | "processed" | "failed";
export type DocumentType = "pdf" | "ppt" | "pptx" | "docx" | "txt";

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_type: DocumentType;
  file_size_bytes: number;
  status: DocumentStatus;
  error_message?: string | null;
  total_chunks: number;
  created_at: string;
  updated_at?: string | null;
}

export type NoteType = "detailed" | "concise" | "exam_revision" | "one_page" | "topic_wise";

export interface Note {
  id: string;
  document_id: string;
  title: string;
  topic?: string | null;
  chapter?: string | null;
  note_type: NoteType;
  content: string;
  order_index: number;
  created_at: string;
}

export type SummaryLength = "short" | "medium" | "detailed";

export interface Summary {
  id: string;
  document_id: string;
  title: string;
  chapter?: string | null;
  length_type: SummaryLength;
  content: string;
  key_concepts?: string | null;
  important_formulas?: string | null;
  important_facts?: string | null;
  exam_tips?: string | null;
  created_at: string;
}

export type DifficultyLevel = "easy" | "medium" | "hard";

export interface Flashcard {
  id: string;
  document_id: string;
  question: string;
  answer: string;
  topic?: string | null;
  difficulty: DifficultyLevel;
  review_count: number;
  is_mastered: boolean;
  created_at: string;
}

export interface MCQ {
  id: string;
  document_id: string;
  question: string;
  options: Record<string, string>;
  correct_option: string;
  explanation: string;
  topic?: string | null;
  difficulty: DifficultyLevel;
  order_index: number;
  created_at: string;
}

export interface SourceCitation {
  chunk_id: string;
  content_snippet: string;
  page_number?: number | null;
}

export interface ChatMessageItem {
  id: string;
  document_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[] | null;
  created_at: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  message_id: string;
}

export interface SearchResultItem {
  document_id: string;
  document_name: string;
  chunk_id: string;
  content: string;
  page_number?: number | null;
  score: number;
}

export interface DashboardStats {
  total_documents: number;
  total_notes: number;
  total_flashcards: number;
  total_mcqs: number;
  total_summaries: number;
  total_chats: number;
}

export interface ActivityItem {
  event_type: string;
  meta?: string | null;
  created_at: string;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  documents_uploaded: TrendPoint[];
  notes_generated: TrendPoint[];
  flashcards_created: TrendPoint[];
  mcqs_generated: TrendPoint[];
  chat_usage: TrendPoint[];
  event_distribution: Record<string, number>;
}

export interface StudyGuide {
  important_topics: string[];
  weak_areas: string[];
  recommended_revision_order: string[];
  last_minute_revision_sheet: string;
  quick_facts_sheet: string;
}
