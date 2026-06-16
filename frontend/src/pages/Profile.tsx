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
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information and activity summary.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> <span className="capitalize">{user.role}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Joined {formatDate(user.created_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Documents</p>
            <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.total_documents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.total_notes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Flashcards</p>
            <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.total_flashcards}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">MCQs</p>
            <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.total_mcqs}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <Loader />
          ) : !documents?.items.length ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.items.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{doc.original_filename}</span>
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
