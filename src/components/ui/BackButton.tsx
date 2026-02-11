"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback } from "react";

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

/**
 * Universal back button component with history navigation.
 * Falls back to a specified path or dashboard if no history exists.
 */
export function BackButton({
  fallbackPath = "/",
  label = "Back",
  className = "",
  showLabel = true,
  disabled = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (disabled) return;
    // Check if there's history to go back to
    // window.history.length > 1 means there's at least one page in history
    // But this can be unreliable, so we use a try-catch approach
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // No history, navigate to fallback
      router.push(fallbackPath);
    }
  }, [router, fallbackPath, disabled]);

  return (
    <button
      onClick={handleBack}
      disabled={disabled}
      className={`inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[var(--muted)] ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
