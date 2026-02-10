"use client";

import { AACCategory, AACCategoryInfo } from "@/lib/types/aac";
import { AAC_CATEGORIES } from "@/features/aac/services/vocabulary";

interface AACCategoryTabsProps {
  activeCategory: AACCategory | "all";
  onCategoryChange: (category: AACCategory | "all") => void;
  sensoryMode: "vibrant" | "muted";
  /** When true, category switching is disabled (Guided Access / navigation lock) */
  disabled?: boolean;
}

export function AACCategoryTabs({
  activeCategory,
  onCategoryChange,
  sensoryMode,
  disabled = false,
}: AACCategoryTabsProps) {
  return (
    <div className={`w-full overflow-x-auto scrollbar-hide py-2 ${disabled ? "pointer-events-none opacity-70" : ""}`}>
      <div className="flex flex-nowrap gap-2 px-1 min-w-max">
        {AAC_CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => !disabled && onCategoryChange(category.id)}
              disabled={disabled}
              className={`
                flex items-center gap-1.5 sm:gap-2
                px-3 sm:px-4 py-2 sm:py-2.5
                rounded-xl sm:rounded-2xl
                text-xs sm:text-sm font-bold
                transition-all duration-300
                whitespace-nowrap
                touch-manipulation
                focus:outline-none focus:ring-2 focus:ring-emerald-500
                ${isActive
                  ? sensoryMode === "muted"
                    ? "bg-gray-600 text-white"
                    : `bg-gradient-to-r ${category.color} text-white shadow-lg`
                  : sensoryMode === "muted"
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    : "glass-premium text-[var(--text)] hover:bg-white/20 dark:hover:bg-white/10"
                }
              `}
              aria-pressed={isActive}
              aria-label={`Filter by ${category.label}`}
            >
              <span role="img" aria-hidden="true">
                {category.icon}
              </span>
              <span className="hidden sm:inline">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
