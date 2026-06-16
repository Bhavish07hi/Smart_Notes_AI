import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search as SearchIcon, FileText } from "lucide-react";
import { searchDocuments } from "@/api/endpoints";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Loader, Badge } from "@/components/ui";

const MODES = [
  { value: "semantic" as const, label: "Semantic" },
  { value: "keyword" as const, label: "Keyword" },
  { value: "hybrid" as const, label: "Hybrid" },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"semantic" | "keyword" | "hybrid">("semantic");

  const searchMutation = useMutation({
    mutationFn: () => searchDocuments(query, mode),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate();
  }

  const results = searchMutation.data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across all your documents using semantic similarity or keyword matching.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Your Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Search notes, summaries, and document content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" disabled={searchMutation.isPending || !query.trim()}>
              <SearchIcon className="h-4 w-4" />
              Search
            </Button>
          </form>
          <div className="flex gap-2">
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  mode === value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {searchMutation.isPending ? (
        <Loader />
      ) : searchMutation.isSuccess && results.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No results found for "{searchMutation.data?.query}".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((result, idx) => (
            <Card key={idx}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {result.document_name}
                    {result.page_number && (
                      <Badge variant="secondary">Page {result.page_number}</Badge>
                    )}
                  </div>
                  <Badge variant="default">Score: {result.score.toFixed(2)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
