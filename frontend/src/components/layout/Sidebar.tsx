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
  LogOut
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

export function Sidebar() {
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
    router.push('/');
  };

  return (
    <aside className="w-64 flex flex-col h-screen border-r border-border/40 bg-background shadow-xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center">
          <Bot className="w-6 h-6 mr-2" />
          AutoML
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium ${
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
        <div className="p-4 border-t border-border flex items-center justify-between gap-2">
           <button 
             onClick={handleUndo} 
             disabled={!summary.can_undo}
             className="flex-1 flex items-center justify-center p-2 bg-secondary text-secondary-foreground rounded text-xs font-medium hover:bg-secondary/80 disabled:opacity-30 transition-colors"
           >
             Undo
           </button>
           <button 
             onClick={handleRedo} 
             disabled={!summary.can_redo}
             className="flex-1 flex items-center justify-center p-2 bg-secondary text-secondary-foreground rounded text-xs font-medium hover:bg-secondary/80 disabled:opacity-30 transition-colors"
           >
             Redo
           </button>
        </div>
      )}
      <div className="p-4 mt-auto border-t border-border flex flex-col gap-3">
        {summary && (
          <>
            <a 
              href={`${BACKEND_URL}/dataset/${summary?.id}/export`}
              download
              className="w-full flex items-center justify-center gap-2 p-2 bg-primary/10 text-primary rounded text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </a>
            <button 
              onClick={handleEject}
              className="w-full flex items-center justify-center gap-2 p-2 bg-destructive/10 text-destructive rounded text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Eject Dataset
            </button>
          </>
        )}
        <div className="text-xs text-muted-foreground text-center">
          AI Data Science Copilot<br/>v1.0.0
        </div>
      </div>
    </aside>
  );
}
