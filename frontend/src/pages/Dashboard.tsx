import { useQuery } from "@tanstack/react-query";
import { FileText, Layers, HelpCircle, BookOpen, Files, MessageSquare } from "lucide-react";
import { getDashboardStats, getRecentActivity, listDocuments } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle, Badge, Loader } from "@/components/ui";
import { cn, formatDate, humanizeEvent } from "@/lib/utils";
import type { DocumentStatus } from "@/types";

const statusVariant: Record<DocumentStatus, "default" | "success" | "warning" | "danger"> = {
  uploaded: "default",
  processing: "warning",
  processed: "success",
  failed: "danger",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => getRecentActivity(10),
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["documents", "recent"],
    queryFn: () => listDocuments(0, 5),
    refetchInterval: 5000,
  });

  const cards = [
    { label: "Uploaded Files", value: stats?.total_documents ?? 0, icon: Files },
    { label: "Notes Generated", value: stats?.total_notes ?? 0, icon: FileText },
    { label: "Flashcards", value: stats?.total_flashcards ?? 0, icon: Layers },
    { label: "MCQs", value: stats?.total_mcqs ?? 0, icon: HelpCircle },
    { label: "Summaries", value: stats?.total_summaries ?? 0, icon: BookOpen },
    { label: "Chat Messages", value: stats?.total_chats ?? 0, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your study materials and AI-generated content.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-2xl font-bold">{statsLoading ? "—" : value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <Loader />
            ) : !documents?.items.length ? (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {documents.items.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.original_filename}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                    </div>
                    <Badge variant={statusVariant[doc.status]} className="capitalize">
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <Loader />
            ) : !activity?.items.length ? (
              <p className="text-sm text-muted-foreground">No activity yet. Upload a document to get started.</p>
            ) : (
              <ul className="space-y-3">
                {activity.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className={cn("font-medium")}>{humanizeEvent(item.event_type)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
