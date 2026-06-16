import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, FileText } from "lucide-react";
import { askQuestion, getChatHistory } from "@/api/endpoints";
import { useDocument } from "@/context/DocumentContext";
import DocumentRequired from "@/components/DocumentRequired";
import Markdown from "@/components/Markdown";
import { Button, Card, CardContent, Input, Loader } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "@/types";

export default function Chat() {
  const { selectedDocumentId } = useDocument();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-history", selectedDocumentId],
    queryFn: () => getChatHistory(selectedDocumentId!),
    enabled: !!selectedDocumentId,
  });

  const askMutation = useMutation({
    mutationFn: (q: string) => askQuestion(selectedDocumentId!, q),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-history", selectedDocumentId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data, askMutation.isPending]);

  if (!selectedDocumentId) return <DocumentRequired />;

  const messages: ChatMessageItem[] = data?.items ?? [];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    askMutation.mutate(question.trim());
    setQuestion("");
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Chat With Documents</h1>
        <p className="text-sm text-muted-foreground">
          Ask questions about your document. Answers are grounded in your content with source citations.
        </p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          {isLoading ? (
            <Loader />
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Start the conversation by asking a question about this document.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Markdown content={message.content} />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
                      <p className="text-xs font-semibold text-muted-foreground">Sources</p>
                      {message.sources.map((source, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <FileText className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>
                            {source.page_number ? `Page ${source.page_number}: ` : ""}
                            {source.content_snippet}
                            {source.content_snippet.length >= 300 ? "..." : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {askMutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-secondary px-4 py-2 text-sm text-muted-foreground">Thinking...</div>
            </div>
          )}
        </div>

        <CardContent className="border-t border-border p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask a question about this document..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={askMutation.isPending}
            />
            <Button type="submit" disabled={askMutation.isPending || !question.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
