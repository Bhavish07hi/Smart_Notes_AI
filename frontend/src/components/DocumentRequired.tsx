import { FileSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

/**
 * Shown on content pages (Notes, Flashcards, MCQs, Summaries, Chat) when
 * no document has been selected yet via the top navbar selector.
 */
export default function DocumentRequired() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <FileSearch className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">Select a document to get started</p>
          <p className="text-sm text-muted-foreground">
            Use the document selector at the top of the page to choose a processed document.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
