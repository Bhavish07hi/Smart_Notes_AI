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
    /* Change 1: Premium Sidebar Container with 72 width & glassmorphism */
    <aside className="hidden w-72 flex-col border-r border-white/10 bg-black/30 backdrop-blur-2xl md:flex">
      
      {/* Change 2: Premium Logo Area with larger branding and subtitle */}
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <GraduationCap className="h-8 w-8 text-blue-400" />
        <div>
          <p className="text-lg font-bold text-white">
            Smart Notes AI
          </p>
          <p className="text-xs text-slate-400">
            AI Learning Platform
          </p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {/* Change 3: Uppercase Navigation Section Header */}
        <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>

        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                /* Change 4: Glowing Active Menu Gradient vs Glass Hover Styles */
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            {/* Change 5: Larger Premium Icons */}
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      
      {/* Change 6: Upgraded Tech-Stack Custom Footer */}
      <div className="border-t border-white/10 p-4 text-xs text-slate-500">
        <div>
          <p>Smart Notes AI</p>
          <p className="mt-1">Powered by Groq + RAG</p>
        </div>
      </div>
    </aside>
  );
}