import { apiClient } from "./client";
import type {
  AuthResponse,
  User,
  Document,
  Note,
  NoteType,
  Summary,
  SummaryLength,
  Flashcard,
  DifficultyLevel,
  MCQ,
  ChatMessageItem,
  ChatResponse,
  SearchResultItem,
  DashboardStats,
  ActivityItem,
  AnalyticsResponse,
  StudyGuide,
} from "@/types";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function registerUser(name: string, email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", { name, email, password });
  return data;
}

export async function loginUser(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function getProfile() {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function uploadDocuments(files: File[], onProgress?: (pct: number) => void) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await apiClient.post<Document[]>("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return data;
}

export async function listDocuments(skip = 0, limit = 50) {
  const { data } = await apiClient.get<{ total: number; items: Document[] }>("/documents", {
    params: { skip, limit },
  });
  return data;
}

export async function getDocument(documentId: string) {
  const { data } = await apiClient.get<Document>(`/documents/${documentId}`);
  return data;
}

export async function getDocumentStatus(documentId: string) {
  const { data } = await apiClient.get<{ id: string; status: string; error_message?: string; total_chunks: number }>(
    `/documents/${documentId}/status`
  );
  return data;
}

export async function deleteDocument(documentId: string) {
  await apiClient.delete(`/documents/${documentId}`);
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function generateNotes(documentId: string, noteTypes: NoteType[]) {
  const { data } = await apiClient.post<{ total: number; items: Note[] }>(
    `/documents/${documentId}/notes/generate`,
    { note_types: noteTypes }
  );
  return data;
}

export async function listNotes(documentId: string) {
  const { data } = await apiClient.get<{ total: number; items: Note[] }>(`/documents/${documentId}/notes`);
  return data;
}

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

export async function generateSummary(documentId: string, lengthType: SummaryLength, chapter?: string) {
  const { data } = await apiClient.post<Summary>(`/documents/${documentId}/summaries/generate`, {
    length_type: lengthType,
    chapter,
  });
  return data;
}

export async function listSummaries(documentId: string) {
  const { data } = await apiClient.get<{ total: number; items: Summary[] }>(`/documents/${documentId}/summaries`);
  return data;
}

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

export async function generateFlashcards(documentId: string, count: number, difficulty?: DifficultyLevel) {
  const { data } = await apiClient.post<{ total: number; items: Flashcard[] }>(
    `/documents/${documentId}/flashcards/generate`,
    { count, difficulty }
  );
  return data;
}

export async function listFlashcards(documentId: string) {
  const { data } = await apiClient.get<{ total: number; items: Flashcard[] }>(
    `/documents/${documentId}/flashcards`
  );
  return data;
}

export async function reviewFlashcard(flashcardId: string, isMastered?: boolean) {
  const { data } = await apiClient.patch<Flashcard>(`/flashcards/${flashcardId}/review`, {
    is_mastered: isMastered,
  });
  return data;
}

// ---------------------------------------------------------------------------
// MCQs
// ---------------------------------------------------------------------------

export async function generateMCQs(documentId: string, count: 10 | 25 | 50, difficulty?: DifficultyLevel) {
  const { data } = await apiClient.post<{ total: number; items: MCQ[] }>(`/documents/${documentId}/mcqs/generate`, {
    count,
    difficulty,
  });
  return data;
}

export async function listMCQs(documentId: string) {
  const { data } = await apiClient.get<{ total: number; items: MCQ[] }>(`/documents/${documentId}/mcqs`);
  return data;
}

// ---------------------------------------------------------------------------
// Study Guide
// ---------------------------------------------------------------------------

export async function generateStudyGuide(documentId: string) {
  const { data } = await apiClient.post<StudyGuide>(`/documents/${documentId}/study-guide/generate`);
  return data;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function askQuestion(documentId: string, question: string) {
  const { data } = await apiClient.post<ChatResponse>(`/documents/${documentId}/chat`, { question });
  return data;
}

export async function getChatHistory(documentId: string) {
  const { data } = await apiClient.get<{ total: number; items: ChatMessageItem[] }>(
    `/documents/${documentId}/chat/history`
  );
  return data;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchDocuments(query: string, mode: "semantic" | "keyword" | "hybrid", documentId?: string) {
  const { data } = await apiClient.post<{ query: string; mode: string; total: number; results: SearchResultItem[] }>(
    "/search",
    { query, mode, document_id: documentId, top_k: 10 }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Dashboard & Analytics
// ---------------------------------------------------------------------------

export async function getDashboardStats() {
  const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
  return data;
}

export async function getRecentActivity(limit = 20) {
  const { data } = await apiClient.get<{ items: ActivityItem[] }>("/dashboard/recent-activity", {
    params: { limit },
  });
  return data;
}

export async function getAnalytics() {
  const { data } = await apiClient.get<AnalyticsResponse>("/analytics");
  return data;
}
