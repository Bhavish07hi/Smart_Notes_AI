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

  /* Change 1: Premium Exam Platform Calculations */
  const progress = mcqs.length > 0 ? (answeredCount / mcqs.length) * 100 : 0;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MCQ Practice</h1>
        <p className="text-sm text-muted-foreground">Test your knowledge with AI-generated multiple choice questions.</p>
        
        {/* Change 3: Premium Overall Progress Status Bar under layout header */}
        {mcqs.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{answeredCount}/{mcqs.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
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
          
          {/* Change 2: Premium Accuracy and Score Badge Indicators */}
          {mcqs.length > 0 && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                Score {correctCount}/{answeredCount}
              </Badge>
              <Badge variant="default">
                {accuracy}% Accuracy
              </Badge>
            </div>
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
              /* Change 4: Premium Dark/Glass Container Layout styling */
              <Card
                key={mcq.id}
                className="border-white/10 bg-white/5 backdrop-blur-xl"
              >
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
                          /* Change 5: Expanded interactive option boxes styles */
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border px-4 py-4 text-base transition-all duration-200",
                            !isAnswered && "hover:bg-secondary",
                            isAnswered && isCorrect && "border-green-500 bg-green-500/10",
                            isAnswered && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                            !isAnswered && "border-border"
                          )}
                        >
                          {/* Change 6: High-visibility Option Letter Badges */}
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-bold">
                              {key}
                            </div>
                            <span>{value}</span>
                          </div>
                          
                          {isAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-destructive" />}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Change 7: Premium Styled Explanation Info Box */}
                  {isAnswered && (
                    <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 text-sm">
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