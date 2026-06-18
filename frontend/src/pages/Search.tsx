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
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across all your documents using semantic similarity or keyword matching.
        </p>
      </div>

      {/* Main Search Panel Box */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl">
        <CardHeader>
          <CardTitle>Search Your Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* Premium Text input layout structure */}
            <Input
              className="h-14 rounded-2xl border-white/10 bg-white/5 text-base"
              placeholder="Search notes, summaries, and document content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="h-14 rounded-2xl px-6"
              disabled={searchMutation.isPending || !query.trim()}
            >
              <SearchIcon className="h-4 w-4 mr-1" />
              Search
            </Button>
          </form>
          
          <div className="flex gap-2">
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  mode === value 
                    ? "border-primary bg-primary text-primary-foreground" 
                    : "border-white/10 bg-transparent hover:bg-white/5"
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
      ) : searchMutation.isIdle ? (
        /* Premium Empty/Idle Hub State */
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl">
          <CardContent>
            <p className="py-24 text-center text-slate-400">
              Search across all uploaded study materials.
            </p>
          </CardContent>
        </Card>
      ) : searchMutation.isSuccess && results.length === 0 ? (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl">
          <CardContent>
            <p className="py-24 text-center text-slate-400">
              No results found for "{searchMutation.data?.query}".
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((result, idx) => (
            /* Premium Interactive Document Search Hit Component cards */
            <Card 
              key={idx} 
              className="border-white/10 bg-white/5 backdrop-blur-xl rounded-xl transition-colors hover:bg-white/5"
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-white">{result.document_name}</span>
                    {result.page_number && (
                      <Badge variant="secondary">Page {result.page_number}</Badge>
                    )}
                  </div>
                  <Badge variant="default">Score: {result.score.toFixed(2)}</Badge>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{result.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}