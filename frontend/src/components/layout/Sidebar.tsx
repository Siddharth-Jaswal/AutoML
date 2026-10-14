'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Database, 
  BarChart2, 
  Wrench, 
  Bot, 
  Download,
  AlertTriangle,
  Activity,
  Target,
  PieChart,
  Wand2,
  LogOut,
  X
} from "lucide-react";

const routes = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dataset", label: "Dataset Overview", icon: Database },
  { href: "/features", label: "Features", icon: BarChart2 },
  { href: "/missing", label: "Missing Values", icon: AlertTriangle },
  { href: "/correlation", label: "Correlation", icon: Activity },
  { href: "/outliers", label: "Outliers", icon: Target },
  { href: "/visualizations", label: "Visualizations", icon: PieChart },
  { href: "/preprocessing", label: "Preprocessing", icon: Wrench },
  { href: "/feature-engineering", label: "Feature Engineering", icon: Wand2 },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
];

import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/config";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({ className = "", onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { summary, setSummary, reset } = useDatasetStore();

  const handleUndo = async () => {
    if (!summary?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/dataset/${summary?.id}/undo`, { method: 'POST' });
      if (res.ok) {
        const newSummary = await res.json();
        setSummary(newSummary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRedo = async () => {
    if (!summary?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/dataset/${summary?.id}/redo`, { method: 'POST' });
      if (res.ok) {
        const newSummary = await res.json();
        setSummary(newSummary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEject = async () => {
    if (!summary?.id) return;
    try {
      await fetch(`${BACKEND_URL}/dataset/${summary?.id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    reset();
    onNavigate?.();
    router.push('/');
  };

  return (
    <aside className={`w-64 flex flex-col h-full border-r border-border/40 bg-background shadow-xl ${className}`}>
      <div className="p-5 flex items-center justify-between border-b border-border/20 md:border-b-0">
        <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center">
          <Bot className="w-6 h-6 mr-2" />
          AutoML
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <route.icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              {route.label}
            </Link>
          );
        })}
      </nav>

      {summary && (summary.can_undo || summary.can_redo) && (
        <div className="p-3 border-t border-border flex items-center justify-between gap-2">
           <button 
             onClick={handleUndo} 
             disabled={!summary.can_undo}
             className="flex-1 flex items-center justify-center p-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 disabled:opacity-30 transition-colors"
           >
             Undo
           </button>
           <button 
             onClick={handleRedo} 
             disabled={!summary.can_redo}
             className="flex-1 flex items-center justify-center p-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 disabled:opacity-30 transition-colors"
           >
             Redo
           </button>
        </div>
      )}

      <div className="p-4 mt-auto border-t border-border flex flex-col gap-2.5">
        {summary && (
          <>
            <a 
              href={`${BACKEND_URL}/dataset/${summary?.id}/export`}
              download
              className="w-full flex items-center justify-center gap-2 p-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </a>
            <button 
              onClick={handleEject}
              className="w-full flex items-center justify-center gap-2 p-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Eject Dataset
            </button>
          </>
        )}
        <div className="text-[11px] text-muted-foreground text-center pt-1">
          AI Data Science Copilot<br/>v1.0.0
        </div>
      </div>
    </aside>
  );
}
