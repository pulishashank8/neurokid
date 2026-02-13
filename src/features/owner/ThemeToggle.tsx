'use client';

import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '@/app/theme-provider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all min-w-[44px] min-h-[44px] justify-center hover:shadow-lg
        ${theme === 'light' 
          ? 'bg-white border-2 border-amber-300 text-amber-600 hover:border-amber-400 hover:bg-amber-50' 
          : 'bg-gray-800 border-2 border-indigo-500 text-indigo-300 hover:border-indigo-400 hover:bg-gray-700'
        } ${className}`}
      title={`Currently: ${theme === 'light' ? 'LIGHT MODE ☀️' : 'DARK MODE 🌙'} - Click to switch`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-xs font-bold hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />
          <span className="text-xs font-bold hidden sm:inline">Dark</span>
        </>
      )}
      <Sparkles className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
