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
          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{
                width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
              }}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </p>

          <div className="flex flex-col items-center justify-center [perspective:1200px]">
            {/* Outer Premium Container Sizing */}
            <div
              onClick={() => setIsFlipped((f) => !f)}
              className={cn(
                "relative h-80 w-full max-w-2xl cursor-pointer transition-all duration-700 hover:scale-[1.01] [transform-style:preserve-3d]",
                isFlipped && "[transform:rotateY(180deg)]"
              )}
            >
              {/* Front Side Premium Design */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl [backface-visibility:hidden]">
                <Badge variant={difficultyVariant[current.difficulty]} className="absolute right-6 top-6 capitalize">
                  {current.difficulty}
                </Badge>
                {current.topic && <Badge variant="secondary" className="absolute left-6 top-6">{current.topic}</Badge>}
                
                <div className="mb-6 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Flashcard
                </div>

                <p className="text-2xl font-semibold leading-relaxed text-white">
                  {current.question}
                </p>
                <p className="absolute bottom-6 text-xs text-muted-foreground">Click to reveal answer</p>
              </div>

              {/* Back Side Premium Design */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[28px] border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950 to-black p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="mb-6 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Answer
                </div>

                <p className="text-xl leading-8 text-slate-200">
                  {current.answer}
                </p>
                <p className="absolute bottom-6 text-xs text-muted-foreground">Click to flip back</p>
              </div>
            </div>

            {/* Subtle Hint Instruction */}
            <p className="mt-4 text-sm text-muted-foreground">
              Click card to flip
            </p>
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