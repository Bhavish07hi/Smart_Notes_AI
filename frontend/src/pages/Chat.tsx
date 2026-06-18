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
        {/* Change 2: Bigger Chat Title */}
        <h1 className="text-3xl font-bold">AI Chat With Documents</h1>
        <p className="text-sm text-muted-foreground">
          Ask questions about your document. Answers are grounded in your content with source citations.
        </p>
        
        {/* Change 3: Add Suggested Questions Quick Links */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Summarize this document",
            "Important exam questions",
            "Explain key concepts",
            "Generate revision notes"
          ].map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Change 1: Premium Glassmorphic Chat Workspace Wrapper Container */}
      <Card className="flex flex-1 flex-col overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          {isLoading ? (
            <Loader />
          ) : messages.length === 0 ? (
            /* Change 12: Better Centered High-Visibility Empty State */
            <p className="py-24 text-center text-base text-slate-400">
              Start the conversation by asking a question about this document.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {/* Change 6: Bigger Message Cards and Padding */}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-5 py-4",
                    /* Change 4 & 5: Premium User Gradient vs AI Textured Glass Bubbles */
                    message.role === "user" 
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                      : "border border-white/10 bg-white/5 backdrop-blur-xl"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Markdown content={message.content} />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                      {/* Change 7: Sexy Capitalized Custom Source Citations Labels */}
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Sources</p>
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
          
          {/* Change 8: Premium Sparkle Premium Thinking Indicator Bubble */}
          {askMutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 backdrop-blur-xl">
                ✨ Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Change 9: Fixed Translucent Sticky Console Bottom Action Bar */}
        <CardContent className="border-t border-white/10 bg-black/30 p-4 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* Change 10: Premium Extended Text Box Layout Area Input */}
            <Input
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-sm"
              placeholder="Ask a question about this document..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={askMutation.isPending}
            />
            {/* Change 11: Premium Large Action Send Trigger Button */}
            <Button 
              type="submit" 
              className="h-12 rounded-2xl px-5"
              disabled={askMutation.isPending || !question.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}