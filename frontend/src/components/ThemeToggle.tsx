'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Rocket } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-28 h-9 bg-card rounded-full border border-border"></div>;
  }

  const themeIndex = theme === 'galactic' ? 2 : theme === 'dark' ? 1 : 0;

  return (
    <div className="flex items-center bg-card border border-border p-1 rounded-full shadow-sm relative w-[104px]">
      <div 
        className="absolute top-1 bottom-1 w-[32px] bg-primary rounded-full transition-transform duration-300 ease-in-out shadow-sm"
        style={{ transform: `translateX(${themeIndex * 100}%)` }}
      />
      
      <button
        onClick={() => setTheme('light')}
        className={`relative z-10 flex items-center justify-center w-8 h-7 rounded-full text-xs transition-colors duration-300 ${
          theme === 'light' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Light Theme"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`relative z-10 flex items-center justify-center w-8 h-7 rounded-full text-xs transition-colors duration-300 ${
          theme === 'dark' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Dark Theme"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('galactic')}
        className={`relative z-10 flex items-center justify-center w-8 h-7 rounded-full text-xs transition-colors duration-300 ${
          theme === 'galactic' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Galactic Theme"
      >
        <Rocket className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
