"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Format count for display: 1000 → "1K", 1500 → "1.5K", 1200000 → "1.2M" (same as resources page) */
function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

interface VoteButtonsProps {
  targetType: "POST" | "COMMENT";
  targetId: string;
  initialScore: number;
  initialLikeCount?: number;
  initialDislikeCount?: number;
  initialUserVote?: number;
  onVote?: (newScore: number) => void;
  disabled?: boolean;
  compact?: boolean;
  layout?: "vertical" | "horizontal";
}

interface VoteDetails {
  likeCount: number;
  dislikeCount: number;
  likers: { username: string; displayName: string | null; avatarUrl: string | null }[];
  dislikers: { username: string; displayName: string | null; avatarUrl: string | null }[];
}

export function VoteButtons({
  targetType,
  targetId,
  initialScore,
  initialLikeCount,
  initialDislikeCount,
  initialUserVote = 0,
  onVote,
  disabled = false,
  compact = false,
  layout = "vertical",
}: VoteButtonsProps) {
  const queryClient = useQueryClient();
  const [userVote, setUserVote] = useState(initialUserVote);
  const [likeCount, setLikeCount] = useState(initialLikeCount ?? 0);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPop, setShowPop] = useState<"up" | "down" | null>(null);
  const [voteDetails, setVoteDetails] = useState<VoteDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    setLikeCount(initialLikeCount ?? 0);
    setDislikeCount(initialDislikeCount ?? 0);
  }, [initialLikeCount, initialDislikeCount]);

  useEffect(() => {
    if (showPop) {
      const t = setTimeout(() => setShowPop(null), 300);
      return () => clearTimeout(t);
    }
  }, [showPop]);

  const handleVote = async (value: number) => {
    if (disabled || isLoading) return;

    const previousUserVote = userVote;
    const newVote = userVote === value ? 0 : value;

    setShowPop(value === 1 ? "up" : "down");
    setUserVote(newVote);
    setIsLoading(true);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, value: newVote }),
      });

      if (!response.ok) throw new Error("Vote failed");

      const data = await response.json();
      setUserVote(data.userVote);
      if (data.likeCount != null) setLikeCount(data.likeCount);
      if (data.dislikeCount != null) setDislikeCount(data.dislikeCount);
      onVote?.(data.voteScore);
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] });
      queryClient.invalidateQueries({ queryKey: ["disliked-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error) {
      setUserVote(previousUserVote);
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoteDetails = async () => {
    if (targetType !== "POST" || voteDetails !== null) return;
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/posts/${targetId}/vote-details`);
      if (res.ok) {
        const data = await res.json();
        setVoteDetails(data);
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const isHorizontal = layout === "horizontal";
  const showLabels = !compact && !isHorizontal;
  const btnClass =
    "flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border-2 transition-all duration-200 touch-manipulation " +
    (isHorizontal
      ? "min-h-[44px] min-w-[44px] p-2"
      : compact
      ? "min-h-[44px] min-w-[44px] p-2 sm:min-h-[40px] sm:min-w-[40px] sm:p-1.5"
      : "min-h-[44px] min-w-[44px] px-3 py-2.5 sm:min-h-[40px] sm:min-w-[40px] sm:px-3 sm:py-2 md:px-4 md:py-2.5") +
    " " +
    (disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95");

  const likeBtnActive =
    "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25";
  const likeBtnInactive =
    "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400";
  const dislikeBtnActive =
    "border-red-500 bg-red-500 text-white shadow-md shadow-red-500/25";
  const dislikeBtnInactive =
    "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-red-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400";

  const CountPopover = ({
    count,
    kind,
  }: {
    count: number;
    kind: "like" | "dislike";
  }) => {
    const displayCount = formatCompactCount(count);
    if (targetType !== "POST") {
      return (
        <span className="font-bold tabular-nums text-xs sm:text-sm text-[var(--muted)]">
          {displayCount}
        </span>
      );
    }
    return (
      <Popover
        onOpenChange={(open) => {
          if (open) fetchVoteDetails();
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="font-bold tabular-nums text-xs sm:text-sm min-w-[1.25rem] text-center hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded"
            aria-label={`${count} ${kind}s - click to see who`}
          >
            {displayCount}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align={isHorizontal ? "end" : "center"}>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--muted)]" />
            </div>
          ) : voteDetails ? (
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] mb-2">
                {kind === "like" ? "Liked by" : "Disliked by"} ({displayCount})
              </p>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {(kind === "like" ? voteDetails.likers : voteDetails.dislikers).map(
                  (u, i) => (
                    <li key={`${u.username}-${i}`} className="text-sm truncate">
                      {u.displayName || u.username}
                    </li>
                  )
                )}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No one yet</p>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div
      className={`flex items-center gap-0.5 sm:gap-1 ${
        isHorizontal ? "flex-row" : "flex-col"
      }`}
    >
      {/* Like block - same size as dislike */}
      <div className={`flex flex-col items-center gap-0.5 ${isHorizontal ? "flex-row gap-1" : ""}`}>
        <button
          onClick={() => handleVote(1)}
          disabled={disabled || isLoading}
          className={`${btnClass} ${
            userVote === 1 ? likeBtnActive : likeBtnInactive
          } ${showPop === "up" ? "animate-vote-pop" : ""}`}
          aria-label={userVote === 1 ? "Liked" : "Like"}
          title="Like"
        >
          <ThumbsUp
            className={`w-4 h-4 sm:w-5 sm:h-5 ${userVote === 1 ? "fill-current" : ""}`}
          />
          {showLabels && (
            <span className="text-xs font-semibold hidden md:inline">Like</span>
          )}
        </button>
        <div className="flex items-center justify-center min-h-[1.25rem]">
          <CountPopover count={likeCount} kind="like" />
        </div>
      </div>

      {/* Dislike block - same size as like */}
      <div className={`flex flex-col items-center gap-0.5 ${isHorizontal ? "flex-row gap-1" : ""}`}>
        <button
          onClick={() => handleVote(-1)}
          disabled={disabled || isLoading}
          className={`${btnClass} ${
            userVote === -1 ? dislikeBtnActive : dislikeBtnInactive
          } ${showPop === "down" ? "animate-vote-pop" : ""}`}
          aria-label={userVote === -1 ? "Disliked" : "Dislike"}
          title="Dislike"
        >
          <ThumbsDown
            className={`w-4 h-4 sm:w-5 sm:h-5 ${userVote === -1 ? "fill-current" : ""}`}
          />
          {showLabels && (
            <span className="text-xs font-semibold hidden md:inline">
              Dislike
            </span>
          )}
        </button>
        <div className="flex items-center justify-center min-h-[1.25rem]">
          <CountPopover count={dislikeCount} kind="dislike" />
        </div>
      </div>
    </div>
  );
}
