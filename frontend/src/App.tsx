import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { DocumentProvider } from "@/context/DocumentContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Notes from "@/pages/Notes";
import Flashcards from "@/pages/Flashcards";
import MCQs from "@/pages/MCQs";
import Summaries from "@/pages/Summaries";
import Chat from "@/pages/Chat";
import Search from "@/pages/Search";
import Analytics from "@/pages/Analytics";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DocumentProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/flashcards" element={<Flashcards />} />
                  <Route path="/mcqs" element={<MCQs />} />
                  <Route path="/summaries" element={<Summaries />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </DocumentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
