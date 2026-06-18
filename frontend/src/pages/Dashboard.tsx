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
        {/* Change 1: Bigger Dashboard Header */}
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your study materials and AI-generated content.</p>
      </div>

      {/* Change 5: Expanded Layout Gap Grid Frame */}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          /* Change 2: Premium Glassmorphic Card Wrapper Frame with hover physics scale */
          <Card 
            key={label}
            className="border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                {/* Change 3: Larger Tech-Toned Blue Icon Elements */}
                <Icon className="h-5 w-5 text-blue-400" />
              </div>
              {/* Change 4: Bigger Bold Typography Counter */}
              <span className="text-3xl font-bold">{statsLoading ? "—" : value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Change 10: Dynamic Productivity Metric Scoring Header Card */}
      <Card className="border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <p className="text-sm text-slate-400">
            Productivity Score
          </p>

          <div className="mt-3 flex items-end gap-3">
            <span className="text-5xl font-bold">
              {Math.min(
                100,
                (stats?.total_documents ?? 0) * 10 + (stats?.total_notes ?? 0)
              )}
            </span>
            <span className="mb-2 text-slate-400">
              /100
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (stats?.total_documents ?? 0) * 10 + (stats?.total_notes ?? 0)
                )}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Change 6: Premium Glass Processing Status Column Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
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
                  /* Change 8: Premium Rounded Sub-Panel Layout Blocks for Document Rows */
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
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

        {/* Change 7: Premium Glass Recent Activity Feed Column Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
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
                  /* Change 9: Premium Structured Layered Activity Items for Feed Row components */
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm"
                  >
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