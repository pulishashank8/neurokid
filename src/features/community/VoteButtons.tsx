"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface VoteButtonsProps {
  targetType: "POST" | "COMMENT";
  targetId: string;
  initialScore?: number;
  initialLikeCount?: number;
  initialDislikeCount?: number;
  initialUserVote?: number;
  onVote?: (data: { voteScore: number; likeCount: number; dislikeCount: number; userVote: number }) => void;
  disabled?: boolean;
  compact?: boolean;
  horizontal?: boolean; // For mobile: [Like count] [Dislike count] in a row
}

export function VoteButtons({
  targetType,
  targetId,
  initialScore = 0,
  initialLikeCount = 0,
  initialDislikeCount = 0,
  initialUserVote = 0,
  onVote,
  disabled = false,
  compact = false,
  horizontal = false,
}: VoteButtonsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);
  const [showPop, setShowPop] = useState<"up" | "down" | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setDislikeCount(initialDislikeCount);
    setUserVote(initialUserVote);
  }, [initialLikeCount, initialDislikeCount, initialUserVote]);

  useEffect(() => {
    if (showPop) {
      const t = setTimeout(() => setShowPop(null), 300);
      return () => clearTimeout(t);
    }
  }, [showPop]);

  const handleVote = async (value: number) => {
    if (disabled || isLoading) return;

    const prevLike = likeCount;
    const prevDislike = dislikeCount;
    const prevUserVote = userVote;
    const newVote = userVote === value ? 0 : value;

    setShowPop(value === 1 ? "up" : "down");
    setUserVote(newVote);
    setLikeCount((c) => c + (newVote === 1 ? 1 : 0) - (prevUserVote === 1 ? 1 : 0));
    setDislikeCount((c) => c + (newVote === -1 ? 1 : 0) - (prevUserVote === -1 ? 1 : 0));
    setIsLoading(true);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, value: newVote }),
      });

      if (!response.ok) throw new Error("Vote failed");

      const data = await response.json();
      setLikeCount(data.likeCount ?? likeCount);
      setDislikeCount(data.dislikeCount ?? dislikeCount);
      setUserVote(data.userVote ?? newVote);
      onVote?.({
        voteScore: data.voteScore,
        likeCount: data.likeCount ?? likeCount,
        dislikeCount: data.dislikeCount ?? dislikeCount,
        userVote: data.userVote ?? newVote,
      });
      // Invalidate My Likes / My Dislikes so tabs show correct data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["liked-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["disliked-posts"] }),
      ]);
    } catch (error) {
      setLikeCount(prevLike);
      setDislikeCount(prevDislike);
      setUserVote(prevUserVote);
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const btn = compact ? "w-8 h-8" : "w-10 h-10";
  const icon = compact ? "w-4 h-4" : "w-5 h-5";

  const getLikeBtnClass = () => {
    const active = userVote === 1;
    const base = "rounded-xl flex items-center justify-center transition-all duration-200";
    const state = active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-[var(--surface2)] text-[var(--muted)] hover:bg-emerald-500/10 hover:text-emerald-600";
    const intClass = disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110 active:scale-95";
    return `${btn} ${base} ${state} ${intClass} ${showPop === "up" ? "animate-vote-pop" : ""}`;
  };
  const getDislikeBtnClass = () => {
    const active = userVote === -1;
    const base = "rounded-xl flex items-center justify-center transition-all duration-200";
    const state = active ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-[var(--surface2)] text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500";
    const disabledCls = disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110 active:scale-95";
    return `${btn} ${base} ${state} ${disabledCls} ${showPop === "down" ? "animate-vote-pop" : ""}`;
  };

  if (horizontal) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleVote(1)}
          disabled={disabled || isLoading}
          className={getLikeBtnClass() + " gap-1.5 px-2"}
          aria-label="Like"
        >
          <ThumbsUp className={`${icon} ${userVote === 1 ? "fill-current" : ""}`} />
          <span className="font-bold text-sm tabular-nums">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => handleVote(-1)}
          disabled={disabled || isLoading}
          className={getDislikeBtnClass() + " gap-1.5 px-2"}
          aria-label="Dislike"
        >
          <ThumbsDown className={`${icon} ${userVote === -1 ? "fill-current" : ""}`} />
          <span className="font-bold text-sm tabular-nums">{dislikeCount}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={() => handleVote(1)} disabled={disabled || isLoading} className={getLikeBtnClass()} aria-label="Like">
        <ThumbsUp className={`${icon} ${userVote === 1 ? "fill-current" : ""}`} />
      </button>
      <span className="font-bold text-sm tabular-nums text-[var(--text)]">{likeCount}</span>
      <button type="button" onClick={() => handleVote(-1)} disabled={disabled || isLoading} className={getDislikeBtnClass()} aria-label="Dislike">
        <ThumbsDown className={`${icon} ${userVote === -1 ? "fill-current" : ""}`} />
      </button>
      <span className="font-bold text-sm tabular-nums text-[var(--text)]">{dislikeCount}</span>
    </div>
  );
}
