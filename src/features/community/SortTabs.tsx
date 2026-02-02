"use client";

import { Sparkles, TrendingUp, Flame } from "lucide-react";

interface SortOption {
  value: "new" | "top" | "hot";
  label: string;
  icon: React.ReactNode;
}

interface SortTabsProps {
  selectedSort: "new" | "top" | "hot";
  onSort: (sort: "new" | "top" | "hot") => void;
}

const sortOptions: SortOption[] = [
  { value: "new", label: "Newest", icon: <Sparkles className="w-4 h-4" /> },
  { value: "top", label: "Top Rated", icon: <TrendingUp className="w-4 h-4" /> },
  { value: "hot", label: "Hot", icon: <Flame className="w-4 h-4" /> },
];

export function SortTabs({ selectedSort, onSort }: SortTabsProps) {
  return (
    <div className="flex gap-2 p-1 bg-[var(--surface2)]/50 rounded-xl">
      {sortOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onSort(option.value)}
          className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
            selectedSort === option.value
              ? "bg-[var(--surface)] text-[var(--text)] shadow-md"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <span className={`transition-transform duration-300 ${
            selectedSort === option.value ? "scale-110" : ""
          }`}>
            {option.icon}
          </span>
          <span>{option.label}</span>
          {selectedSort === option.value && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--primary)] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
