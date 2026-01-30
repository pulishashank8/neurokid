"use client";

import { X, Volume2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AACSentenceWord } from "@/lib/types/aac";

interface AACSentenceBarProps {
  sentence: AACSentenceWord[];
  highlightedWordIndex: number;
  isSpeaking: boolean;
  onRemoveWord: (index: number) => void;
  onClear: () => void;
  onSpeak: () => void;
  sensoryMode: "vibrant" | "muted";
}

export function AACSentenceBar({
  sentence,
  highlightedWordIndex,
  isSpeaking,
  onRemoveWord,
  onClear,
  onSpeak,
  sensoryMode,
}: AACSentenceBarProps) {
  const isEmpty = sentence.length === 0;

  return (
    <div className={`
      w-full rounded-2xl sm:rounded-3xl
      backdrop-blur-xl bg-white/10 dark:bg-white/5
      border border-white/20 dark:border-white/10
      p-3 sm:p-4
      ${sensoryMode === "muted" ? "shadow-md" : "shadow-luxury"}
    `}>
      {/* Sentence display area */}
      <div className="flex items-center gap-2 mb-3 min-h-[48px] sm:min-h-[56px]">
        <div className="flex-1 flex flex-wrap gap-1.5 sm:gap-2">
          <AnimatePresence mode="popLayout">
            {isEmpty ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-sm sm:text-base text-[var(--muted)] italic"
              >
                Tap words to build a sentence...
              </motion.span>
            ) : (
              sentence.map((sw, index) => (
                <motion.span
                  key={`${sw.word.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`
                    inline-flex items-center gap-1
                    px-2 sm:px-3 py-1 sm:py-1.5
                    rounded-lg sm:rounded-xl
                    text-sm sm:text-base font-medium
                    transition-all duration-200
                    ${index === highlightedWordIndex && isSpeaking
                      ? "bg-emerald-500 text-white scale-105 karaoke-word active"
                      : sensoryMode === "muted"
                        ? "bg-gray-200 dark:bg-gray-700 text-[var(--text)]"
                        : "bg-white/20 dark:bg-white/10 text-[var(--text)]"
                    }
                  `}
                >
                  <span role="img" aria-hidden="true" className="text-base sm:text-lg">
                    {sw.word.symbol}
                  </span>
                  <span>{sw.word.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveWord(index);
                    }}
                    className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label={`Remove ${sw.word.label}`}
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </motion.span>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Speak button */}
        <button
          onClick={onSpeak}
          disabled={isEmpty || isSpeaking}
          className={`
            flex-1 flex items-center justify-center gap-2
            px-4 sm:px-6 py-2.5 sm:py-3
            rounded-xl sm:rounded-2xl
            text-sm sm:text-base font-bold
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-emerald-500
            ${sensoryMode === "muted"
              ? "bg-emerald-600 text-white"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
            }
            ${isSpeaking ? "animate-pulse" : ""}
          `}
          aria-label={isSpeaking ? "Speaking..." : "Speak sentence"}
        >
          <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-bounce" : ""}`} />
          <span>{isSpeaking ? "Speaking..." : "Speak"}</span>
        </button>

        {/* Clear button */}
        <button
          onClick={onClear}
          disabled={isEmpty}
          className={`
            flex items-center justify-center gap-2
            px-3 sm:px-4 py-2.5 sm:py-3
            rounded-xl sm:rounded-2xl
            text-sm sm:text-base font-bold
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-rose-500
            ${sensoryMode === "muted"
              ? "bg-gray-500 text-white"
              : "bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30"
            }
          `}
          aria-label="Clear sentence"
        >
          <Trash2 className="w-5 h-5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </div>
  );
}
