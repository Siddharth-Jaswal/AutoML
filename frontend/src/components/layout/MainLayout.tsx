import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background relative">
        <div className="absolute top-4 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="h-full p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
