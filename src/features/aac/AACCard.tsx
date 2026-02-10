"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { AACWord } from "@/lib/types/aac";

interface AACCardProps {
  word: AACWord;
  onPress: (word: AACWord) => void;
  sensoryMode: "vibrant" | "muted";
  isHighlighted?: boolean;
  size?: "sm" | "md" | "lg";
}

export const AACCard = memo(function AACCard({
  word,
  onPress,
  sensoryMode,
  isHighlighted = false,
  size = "md",
}: AACCardProps) {
  const sizeClasses = {
    sm: "p-2 gap-1",
    md: "p-3 sm:p-4 gap-2",
    lg: "p-4 sm:p-6 gap-3",
  };

  const iconSizes = {
    sm: "text-2xl sm:text-3xl",
    md: "text-3xl sm:text-4xl lg:text-5xl",
    lg: "text-4xl sm:text-5xl lg:text-6xl",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm sm:text-base",
    lg: "text-base sm:text-lg",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      onClick={() => onPress(word)}
      className={`
        relative aspect-square rounded-2xl sm:rounded-3xl
        bg-white/10 dark:bg-white/5
        lg:backdrop-blur-xl
        border border-white/20 dark:border-white/10
        flex flex-col items-center justify-center
        ${sizeClasses[size]}
        ${sensoryMode === "muted"
          ? "opacity-90 saturate-50 shadow-md"
          : "shadow-luxury hover:shadow-luxury-hover"}
        ${isHighlighted
          ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-transparent bg-emerald-500/10"
          : ""}
        transition-all duration-300 ease-out
        cursor-pointer touch-manipulation
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
      `}
      aria-label={`Say ${word.audioText || word.label}`}
      data-testid="aac-card"
    >
      {/* Symbol/Emoji */}
      <span
        className={`${iconSizes[size]} select-none`}
        role="img"
        aria-hidden="true"
      >
        {word.symbol}
      </span>

      {/* Label */}
      <span className={`
        ${textSizes[size]} font-bold text-[var(--text)]
        text-center leading-tight
        max-w-full truncate px-1
      `}>
        {word.label}
      </span>

      {/* Core indicator */}
      {word.isCore && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
          <span className="text-[8px] sm:text-[10px] text-amber-500 font-bold">
            ★
          </span>
        </div>
      )}
    </motion.button>
  );
});
