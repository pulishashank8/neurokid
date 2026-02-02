"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VoteButtonsProps {
  targetType: "POST" | "COMMENT";
  targetId: string;
  initialScore: number;
  initialUserVote?: number;
  onVote?: (newScore: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function VoteButtons({
  targetType,
  targetId,
  initialScore,
  initialUserVote = 0,
  onVote,
  disabled = false,
  compact = false,
}: VoteButtonsProps) {
  const [voteScore, setVoteScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"up" | "down" | null>(null);
  const [showPop, setShowPop] = useState<"up" | "down" | null>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (animationDirection) {
      const timer = setTimeout(() => setAnimationDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [animationDirection]);

  useEffect(() => {
    if (showPop) {
      const timer = setTimeout(() => setShowPop(null), 300);
      return () => clearTimeout(timer);
    }
  }, [showPop]);

  const handleVote = async (value: number) => {
    if (disabled || isLoading) return;

    const previousScore = voteScore;
    const previousUserVote = userVote;
    const newVote = userVote === value ? 0 : value;
    const scoreChange = newVote - userVote;

    setAnimationDirection(scoreChange > 0 ? "up" : scoreChange < 0 ? "down" : null);
    setShowPop(value === 1 ? "up" : "down");
    setUserVote(newVote);
    setVoteScore(voteScore + scoreChange);
    setIsLoading(true);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          value: newVote,
        }),
      });

      if (!response.ok) {
        throw new Error("Vote failed");
      }

      const data = await response.json();
      setVoteScore(data.voteScore);
      setUserVote(data.userVote);
      onVote?.(data.voteScore);
    } catch (error) {
      setVoteScore(previousScore);
      setUserVote(previousUserVote);
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSize = compact ? "w-8 h-8" : "w-10 h-10";
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={disabled || isLoading}
        className={`${buttonSize} rounded-xl flex items-center justify-center transition-all duration-200 ${
          userVote === 1
            ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30"
            : "bg-[var(--surface2)] text-[var(--muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
        } ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110 active:scale-95"} ${
          showPop === "up" ? "animate-vote-pop" : ""
        }`}
        aria-label="Upvote"
      >
        <ChevronUp className={`${iconSize} ${userVote === 1 ? "stroke-[3]" : "stroke-2"}`} />
      </button>

      <div className="relative h-6 flex items-center justify-center overflow-hidden">
        <span
          ref={scoreRef}
          className={`font-bold text-sm tabular-nums ${
            userVote === 1
              ? "text-[var(--primary)]"
              : userVote === -1
              ? "text-red-500"
              : "text-[var(--muted)]"
          } ${
            animationDirection === "up"
              ? "animate-count-up"
              : animationDirection === "down"
              ? "animate-count-down"
              : ""
          }`}
        >
          {voteScore}
        </span>
      </div>

      <button
        onClick={() => handleVote(-1)}
        disabled={disabled || isLoading}
        className={`${buttonSize} rounded-xl flex items-center justify-center transition-all duration-200 ${
          userVote === -1
            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
            : "bg-[var(--surface2)] text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
        } ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110 active:scale-95"} ${
          showPop === "down" ? "animate-vote-pop" : ""
        }`}
        aria-label="Downvote"
      >
        <ChevronDown className={`${iconSize} ${userVote === -1 ? "stroke-[3]" : "stroke-2"}`} />
      </button>
    </div>
  );
}
