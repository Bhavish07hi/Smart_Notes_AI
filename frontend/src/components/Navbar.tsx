import { useNavigate } from "react-router-dom";
import { LogOut, Menu, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";
import { useDocument } from "@/context/DocumentContext";
import DocumentSelector from "@/components/DocumentSelector";

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { selectedDocumentId, setSelectedDocumentId } = useDocument();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button className="rounded-md p-2 hover:bg-secondary md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 md:hidden">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-bold">Smart Notes AI</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <DocumentSelector value={selectedDocumentId} onChange={setSelectedDocumentId} />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{user?.name}</p>
          <p className="text-xs text-muted-foreground leading-tight">{user?.role}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
