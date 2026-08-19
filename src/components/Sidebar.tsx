import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  ShieldAlert,
  Star,
  Newspaper,
  Sun,
  Moon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarSection =
  | "overview"
  | "market"
  | "portfolio"
  | "risk"
  | "watchlist"
  | "news";

interface SidebarProps {
  activeSection: SidebarSection;
  onNavigate: (section: SidebarSection) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS: { id: SidebarSection; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
  { id: "market", label: "Market", icon: <TrendingUp className="size-4" /> },
  { id: "portfolio", label: "Portfolio", icon: <Briefcase className="size-4" /> },
  { id: "risk", label: "Risk & Opportunity", icon: <ShieldAlert className="size-4" /> },
  { id: "watchlist", label: "Watchlist", icon: <Star className="size-4" /> },
  { id: "news", label: "News", icon: <Newspaper className="size-4" /> },
];

export function Sidebar({
  activeSection,
  onNavigate,
  isDark,
  onToggleTheme,
  onRefresh,
  isRefreshing,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-56",
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 border-b border-border shrink-0", isCollapsed ? "justify-center px-2" : "px-4")}>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
            <Zap className="size-4" />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-semibold tracking-tight">
              Nexus
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                isCollapsed && "justify-center px-2",
                activeSection === item.id
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border p-1.5 flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onRefresh}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors",
            isCollapsed && "justify-center px-2",
          )}
          title="Refresh data"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          {!isCollapsed && <span>Refresh</span>}
        </button>

        <button
          onClick={onToggleTheme}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors",
            isCollapsed && "justify-center px-2",
          )}
          title="Toggle theme"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {!isCollapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors",
            isCollapsed && "justify-center px-2",
          )}
          title="Toggle sidebar"
        >
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
