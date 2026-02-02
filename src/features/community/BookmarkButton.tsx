"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import toast from "react-hot-toast";

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked?: boolean;
  onToggle?: (bookmarked: boolean) => void;
}

export function BookmarkButton({
  postId,
  initialBookmarked = false,
  onToggle,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [showPop, setShowPop] = useState(false);

  const handleToggle = async () => {
    if (isLoading) return;

    const previousBookmarked = bookmarked;
    setBookmarked(!bookmarked);
    setShowPop(true);
    setTimeout(() => setShowPop(false), 300);

    setIsLoading(true);

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error("Bookmark toggle failed");
      }

      const data = await response.json();
      setBookmarked(data.bookmarked);
      onToggle?.(data.bookmarked);

      toast.success(data.message, {
        style: {
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        },
      });
    } catch (error) {
      setBookmarked(previousBookmarked);
      toast.error("Failed to update bookmark");
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
        bookmarked
          ? "bg-amber-500/10 text-amber-500"
          : "bg-[var(--surface2)] text-[var(--muted)] hover:bg-[var(--surface2)]/80 hover:text-[var(--text)]"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"} ${
        showPop ? "animate-vote-pop" : ""
      }`}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark post"}
      title={bookmarked ? "Remove bookmark" : "Bookmark post"}
    >
      <Bookmark
        className={`w-5 h-5 transition-all ${bookmarked ? "fill-current" : ""}`}
      />
    </button>
  );
}
