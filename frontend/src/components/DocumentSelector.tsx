import { useQuery } from "@tanstack/react-query";
import { listDocuments } from "@/api/endpoints";

interface DocumentSelectorProps {
  value: string | null;
  onChange: (id: string | null) => void;
}

/**
 * Dropdown that lets the user pick which processed document to work with
 * for notes, flashcards, MCQs, summaries, and chat.
 */
export default function DocumentSelector({ value, onChange }: DocumentSelectorProps) {
  const { data } = useQuery({
    queryKey: ["documents", "selector"],
    queryFn: () => listDocuments(0, 100),
  });

  const processedDocs = data?.items ?? [];

  return (
    <select
      className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Select a document...</option>
      {processedDocs.map((doc) => (
        <option key={doc.id} value={doc.id}>
          {doc.original_filename}
        </option>
      ))}
    </select>
  );
}
