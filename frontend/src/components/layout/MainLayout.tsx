'use client';
import { useState } from 'react';
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, Bot } from "lucide-react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex shrink-0 h-screen sticky top-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Slide-Over */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:hidden transition-transform duration-300 ease-in-out ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar 
          onNavigate={() => setIsMobileNavOpen(false)}
          onClose={() => setIsMobileNavOpen(false)}
        />
      </div>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative w-full">
        {/* Mobile Sticky Top Header */}
        <header className="md:hidden sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 -ml-2 rounded-lg text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 font-bold tracking-tight text-primary text-lg">
            <Bot className="w-5 h-5 text-primary" />
            <span>AutoML</span>
          </div>

          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </header>

        {/* Desktop Absolute Theme Toggle */}
        <div className="hidden md:block absolute top-4 right-6 z-40">
          <ThemeToggle />
        </div>

        {/* Scrollable Page Body with Responsive Padding */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
