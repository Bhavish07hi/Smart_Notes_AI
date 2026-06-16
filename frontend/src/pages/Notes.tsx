import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { generateNotes, listNotes } from "@/api/endpoints";
import { useDocument } from "@/context/DocumentContext";
import DocumentRequired from "@/components/DocumentRequired";
import Markdown from "@/components/Markdown";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Loader } from "@/components/ui";
import type { NoteType } from "@/types";

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "detailed", label: "Detailed" },
  { value: "concise", label: "Concise" },
  { value: "exam_revision", label: "Exam Revision" },
  { value: "one_page", label: "One Page" },
  { value: "topic_wise", label: "Topic-wise" },
];

export default function Notes() {
  const { selectedDocumentId } = useDocument();
  const queryClient = useQueryClient();
  const [selectedTypes, setSelectedTypes] = useState<NoteType[]>(["detailed", "concise"]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notes", selectedDocumentId],
    queryFn: () => listNotes(selectedDocumentId!),
    enabled: !!selectedDocumentId,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateNotes(selectedDocumentId!, selectedTypes),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["notes", selectedDocumentId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (result.items.length > 0) setActiveNoteId(result.items[0].id);
    },
  });

  if (!selectedDocumentId) return <DocumentRequired />;

  const notes = data?.items ?? [];
  const activeNote = notes.find((n) => n.id === activeNoteId) ?? notes[0];

  function toggleType(type: NoteType) {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Smart Notes</h1>
          <p className="text-sm text-muted-foreground">AI-generated structured notes for your document.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {NOTE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleType(value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedTypes.includes(value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={selectedTypes.length === 0 || generateMutation.isPending}
          >
            <Sparkles className="h-4 w-4" />
            {generateMutation.isPending ? "Generating..." : "Generate Notes"}
          </Button>
          {generateMutation.isError && (
            <p className="text-sm text-destructive">
              {(generateMutation.error as any)?.response?.data?.detail ?? "Failed to generate notes."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generated Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader />
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes generated yet.</p>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                      activeNote?.id === note.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                    }`}
                  >
                    <p className="font-medium truncate">{note.title}</p>
                    <Badge variant="secondary" className="mt-1 capitalize">
                      {note.note_type.replace("_", " ")}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{activeNote ? activeNote.title : "Select a note"}</CardTitle>
            {activeNote?.topic && <p className="text-sm text-muted-foreground">Topic: {activeNote.topic}</p>}
          </CardHeader>
          <CardContent>
            {activeNote ? (
              <Markdown content={activeNote.content} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate notes above, then select one to view its content.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
