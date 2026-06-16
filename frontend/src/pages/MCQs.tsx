import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { generateMCQs, listMCQs } from "@/api/endpoints";
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

export default function MCQs() {
  const { selectedDocumentId } = useDocument();
  const queryClient = useQueryClient();
  const [count, setCount] = useState<10 | 25 | 50>(10);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["mcqs", selectedDocumentId],
    queryFn: () => listMCQs(selectedDocumentId!),
    enabled: !!selectedDocumentId,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateMCQs(selectedDocumentId!, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcqs", selectedDocumentId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setAnswers({});
    },
  });

  if (!selectedDocumentId) return <DocumentRequired />;

  const mcqs = data?.items ?? [];

  function selectAnswer(mcqId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [mcqId]: option }));
  }

  const answeredCount = Object.keys(answers).length;
  const correctCount = mcqs.filter((m) => answers[m.id] === m.correct_option).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MCQ Practice</h1>
        <p className="text-sm text-muted-foreground">Test your knowledge with AI-generated multiple choice questions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate MCQs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {([10, 25, 50] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  count === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
                }`}
              >
                {c} MCQs
              </button>
            ))}
          </div>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <Sparkles className="h-4 w-4" />
            {generateMutation.isPending ? "Generating..." : "Generate MCQs"}
          </Button>
          {mcqs.length > 0 && (
            <Badge variant="secondary">
              Score: {correctCount}/{answeredCount} answered ({mcqs.length} total)
            </Badge>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader />
      ) : mcqs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No MCQs yet. Generate some above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mcqs.map((mcq, idx) => {
            const selected = answers[mcq.id];
            const isAnswered = !!selected;
            return (
              <Card key={mcq.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      {idx + 1}. {mcq.question}
                    </p>
                    <Badge variant={difficultyVariant[mcq.difficulty]} className="capitalize shrink-0">
                      {mcq.difficulty}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(mcq.options).map(([key, value]) => {
                      const isCorrect = key === mcq.correct_option;
                      const isSelected = key === selected;
                      return (
                        <button
                          key={key}
                          onClick={() => selectAnswer(mcq.id, key)}
                          disabled={isAnswered}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                            !isAnswered && "hover:bg-secondary",
                            isAnswered && isCorrect && "border-green-500 bg-green-500/10",
                            isAnswered && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                            !isAnswered && "border-border"
                          )}
                        >
                          <span>
                            <span className="font-semibold">{key}.</span> {value}
                          </span>
                          {isAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-destructive" />}
                        </button>
                      );
                    })}
                  </div>
                  {isAnswered && (
                    <div className="rounded-md bg-secondary p-3 text-sm">
                      <p className="font-medium">Explanation</p>
                      <p className="text-muted-foreground">{mcq.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
