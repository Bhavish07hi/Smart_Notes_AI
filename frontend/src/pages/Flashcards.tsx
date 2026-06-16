import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ChevronLeft, ChevronRight, RotateCw, CheckCircle2 } from "lucide-react";
import { generateFlashcards, listFlashcards, reviewFlashcard } from "@/api/endpoints";
import { useDocument } from "@/context/DocumentContext";
import DocumentRequired from "@/components/DocumentRequired";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Loader } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DifficultyLevel } from "@/types";

const difficultyVariant: Record<DifficultyLevel, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export default function Flashcards() {
  const { selectedDocumentId } = useDocument();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["flashcards", selectedDocumentId],
    queryFn: () => listFlashcards(selectedDocumentId!),
    enabled: !!selectedDocumentId,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateFlashcards(selectedDocumentId!, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", selectedDocumentId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setCurrentIndex(0);
      setIsFlipped(false);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, mastered }: { id: string; mastered: boolean }) => reviewFlashcard(id, mastered),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flashcards", selectedDocumentId] }),
  });

  if (!selectedDocumentId) return <DocumentRequired />;

  const flashcards = data?.items ?? [];
  const current = flashcards[currentIndex];

  function goNext() {
    setIsFlipped(false);
    setCurrentIndex((idx) => Math.min(idx + 1, flashcards.length - 1));
  }

  function goPrev() {
    setIsFlipped(false);
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <p className="text-sm text-muted-foreground">Review concepts with flip cards and track your mastery.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Flashcards</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {[10, 20, 30].map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  count === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
                }`}
              >
                {c} cards
              </button>
            ))}
          </div>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <Sparkles className="h-4 w-4" />
            {generateMutation.isPending ? "Generating..." : "Generate Flashcards"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader />
      ) : flashcards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No flashcards yet. Generate some above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </p>

          <div className="flex justify-center [perspective:1200px]">
            <div
              onClick={() => setIsFlipped((f) => !f)}
              className={cn(
                "relative h-64 w-full max-w-xl cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]",
                isFlipped && "[transform:rotateY(180deg)]"
              )}
            >
              {/* Front */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6 text-center shadow-sm [backface-visibility:hidden]">
                <Badge variant={difficultyVariant[current.difficulty]} className="absolute right-4 top-4 capitalize">
                  {current.difficulty}
                </Badge>
                {current.topic && <Badge variant="secondary" className="absolute left-4 top-4">{current.topic}</Badge>}
                <p className="text-lg font-medium">{current.question}</p>
                <p className="mt-4 text-xs text-muted-foreground">Click to reveal answer</p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-primary bg-primary/5 p-6 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <p className="text-lg">{current.answer}</p>
                <p className="mt-4 text-xs text-muted-foreground">Click to flip back</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={goPrev} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setIsFlipped((f) => !f)}>
              <RotateCw className="h-4 w-4" />
              Flip
            </Button>
            <Button
              variant="secondary"
              onClick={() => reviewMutation.mutate({ id: current.id, mastered: true })}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark mastered
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} disabled={currentIndex === flashcards.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {current.is_mastered && (
            <p className="text-center text-sm text-green-600 dark:text-green-400">You've mastered this card.</p>
          )}
        </div>
      )}
    </div>
  );
}
