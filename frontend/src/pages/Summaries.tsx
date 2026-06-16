import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, BookOpen } from "lucide-react";
import { generateSummary, listSummaries, generateStudyGuide } from "@/api/endpoints";
import { useDocument } from "@/context/DocumentContext";
import DocumentRequired from "@/components/DocumentRequired";
import Markdown from "@/components/Markdown";
import { Button, Card, CardContent, CardHeader, CardTitle, Loader, Badge } from "@/components/ui";
import type { SummaryLength, StudyGuide } from "@/types";

const LENGTHS: { value: SummaryLength; label: string }[] = [
  { value: "short", label: "Short (100-200 words)" },
  { value: "medium", label: "Medium (300-500 words)" },
  { value: "detailed", label: "Detailed (1000+ words)" },
];

export default function Summaries() {
  const { selectedDocumentId } = useDocument();
  const queryClient = useQueryClient();
  const [length, setLength] = useState<SummaryLength>("medium");
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["summaries", selectedDocumentId],
    queryFn: () => listSummaries(selectedDocumentId!),
    enabled: !!selectedDocumentId,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateSummary(selectedDocumentId!, length),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summaries", selectedDocumentId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const studyGuideMutation = useMutation({
    mutationFn: () => generateStudyGuide(selectedDocumentId!),
    onSuccess: (result) => setStudyGuide(result),
  });

  if (!selectedDocumentId) return <DocumentRequired />;

  const summaries = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Summaries & Study Guide</h1>
        <p className="text-sm text-muted-foreground">
          Generate chapter summaries at different lengths and an exam preparation guide.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLength(value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  length === value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <Sparkles className="h-4 w-4" />
            {generateMutation.isPending ? "Generating..." : "Generate Summary"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => studyGuideMutation.mutate()}
            disabled={studyGuideMutation.isPending}
          >
            <BookOpen className="h-4 w-4" />
            {studyGuideMutation.isPending ? "Generating..." : "Generate Study Guide"}
          </Button>
        </CardContent>
      </Card>

      {studyGuide && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Preparation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-sm font-semibold">Important Topics</p>
              <div className="flex flex-wrap gap-2">
                {studyGuide.important_topics.map((t, i) => (
                  <Badge key={i} variant="default">{t}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">Weak Areas</p>
              <div className="flex flex-wrap gap-2">
                {studyGuide.weak_areas.map((t, i) => (
                  <Badge key={i} variant="warning">{t}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">Recommended Revision Order</p>
              <ol className="list-decimal space-y-1 pl-6 text-sm">
                {studyGuide.recommended_revision_order.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">Last-Minute Revision Sheet</p>
              <Markdown content={studyGuide.last_minute_revision_sheet} />
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">Quick Facts Sheet</p>
              <Markdown content={studyGuide.quick_facts_sheet} />
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Loader />
      ) : summaries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No summaries yet. Generate one above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {summaries.map((summary) => (
            <Card key={summary.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{summary.title}</CardTitle>
                <Badge variant="secondary" className="capitalize">{summary.length_type}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <Markdown content={summary.content} />
                {summary.key_concepts && (
                  <div>
                    <p className="mb-1 text-sm font-semibold">Key Concepts</p>
                    <Markdown content={summary.key_concepts} />
                  </div>
                )}
                {summary.important_formulas && (
                  <div>
                    <p className="mb-1 text-sm font-semibold">Important Formulas</p>
                    <Markdown content={summary.important_formulas} />
                  </div>
                )}
                {summary.important_facts && (
                  <div>
                    <p className="mb-1 text-sm font-semibold">Important Facts</p>
                    <Markdown content={summary.important_facts} />
                  </div>
                )}
                {summary.exam_tips && (
                  <div>
                    <p className="mb-1 text-sm font-semibold">Exam Tips</p>
                    <Markdown content={summary.exam_tips} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
