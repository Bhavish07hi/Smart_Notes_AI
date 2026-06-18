import { useQuery } from "@tanstack/react-query";
import { User as UserIcon, Mail, Calendar, Shield } from "lucide-react";
import { listDocuments, getDashboardStats } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, Badge, Loader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function Profile() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["documents", "profile"],
    queryFn: () => listDocuments(0, 100),
  });

  if (!user) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        {/* Scaled Header Typography */}
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information and activity summary.</p>
      </div>

      {/* Upgraded Premium Glassmorphic User Hero Section & Details Card */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          {/* Custom Dynamic Gradient Avatar Frame */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">Smart Notes AI User</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-slate-400" /> {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-slate-400" /> <span className="capitalize">{user.role}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" /> Joined {formatDate(user.created_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Statistics Matrix Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Documents</p>
            <p className="text-2xl font-bold text-white">{statsLoading ? "—" : stats?.total_documents}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Notes</p>
            <p className="text-2xl font-bold text-white">{statsLoading ? "—" : stats?.total_notes}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Flashcards</p>
            <p className="text-2xl font-bold text-white">{statsLoading ? "—" : stats?.total_flashcards}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">MCQs</p>
            <p className="text-2xl font-bold text-white">{statsLoading ? "—" : stats?.total_mcqs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Materials Panel */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <UserIcon className="h-4 w-4 text-slate-400" /> Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <Loader />
          ) : !documents?.items.length ? (
            <p className="text-sm text-slate-400">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.items.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between text-sm rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                  <span className="truncate text-slate-200 font-medium">{doc.original_filename}</span>
                  <Badge variant="secondary" className="capitalize">{doc.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}