import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Layers,
  HelpCircle,
  BookOpen,
  MessageSquare,
  BarChart3,
  User,
  GraduationCap,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload Files", icon: Upload },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/mcqs", label: "MCQs", icon: HelpCircle },
  { to: "/summaries", label: "Summaries", icon: BookOpen },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/search", label: "Search", icon: Search },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Smart Notes AI</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Smart Notes Generator AI
      </div>
    </aside>
  );
}
