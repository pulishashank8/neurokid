"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AACWord } from "@/lib/types/aac";

interface AACPredictionBarProps {
  predictions: AACWord[];
  onSelect: (word: AACWord) => void;
  sensoryMode: "vibrant" | "muted";
}

export function AACPredictionBar({
  predictions,
  onSelect,
  sensoryMode,
}: AACPredictionBarProps) {
  if (predictions.length === 0) {
    return null;
  }

  return (
    <div className={`
      w-full rounded-xl sm:rounded-2xl
      backdrop-blur-xl bg-white/5 dark:bg-white/5
      border border-white/10 dark:border-white/5
      p-2 sm:p-3
      ${sensoryMode === "muted" ? "shadow-sm" : "shadow-md"}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
        <span className="text-[10px] sm:text-xs text-[var(--muted)] font-medium">
          Suggested next words
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <AnimatePresence mode="popLayout">
          {predictions.slice(0, 6).map((word, index) => (
            <motion.button
              key={word.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: index * 0.05,
              }}
              onClick={() => onSelect(word)}
              className={`
                inline-flex items-center gap-1 sm:gap-1.5
                px-2 sm:px-3 py-1 sm:py-1.5
                rounded-lg sm:rounded-xl
                text-xs sm:text-sm font-medium
                transition-all duration-200
                ${sensoryMode === "muted"
                  ? "bg-gray-200 dark:bg-gray-700 text-[var(--text)] hover:bg-gray-300 dark:hover:bg-gray-600"
                  : "bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 hover:scale-105"
                }
                focus:outline-none focus:ring-2 focus:ring-amber-500
              `}
            >
              <span role="img" aria-hidden="true" className="text-sm sm:text-base">
                {word.symbol}
              </span>
              <span>{word.label}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
