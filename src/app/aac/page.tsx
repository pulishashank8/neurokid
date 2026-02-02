"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minimize2, X } from "lucide-react";
import Link from "next/link";
import { AACBoard } from "@/features/aac/AACBoard";
import { useBiometricGuard } from "@/features/aac/hooks/useBiometricGuard";

export default function AACPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle fullscreen exit
  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  // Biometric guard for exiting fullscreen (long press)
  const {
    progress,
    isHolding,
    handleTouchStart,
    handleTouchEnd,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
  } = useBiometricGuard({
    holdDuration: 2500,
    onExit: handleExitFullscreen,
    enabled: isFullscreen,
  });

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      handleExitFullscreen();
    } else {
      setIsFullscreen(true);
      // Try to enter browser fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(console.error);
      }
    }
  }, [isFullscreen, handleExitFullscreen]);

  // Handle browser fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Prevent accidental back navigation in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isFullscreen]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Normal mode with navigation */}
      <AnimatePresence mode="wait">
        {!isFullscreen ? (
          <motion.div
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[var(--background)]"
          >
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--border)]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-4">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="hidden sm:inline">Back</span>
                    </Link>
                    <div className="h-6 w-px bg-[var(--border)]" />
                    <h1 className="text-lg sm:text-xl font-bold text-[var(--text)]">
                      AAC Communicator
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-xs text-[var(--muted)]">
                      Premium Feature
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">
                      ✨ New
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 max-w-7xl mx-auto w-full">
              <div className="h-[calc(100vh-4rem)]">
                <AACBoard
                  onToggleFullscreen={toggleFullscreen}
                  isFullscreen={isFullscreen}
                />
              </div>
            </main>
          </motion.div>
        ) : (
          /* Fullscreen mode */
          <motion.div
            key="fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[var(--background)] aac-fullscreen"
          >
            {/* Exit button with biometric guard */}
            <div className="absolute top-4 right-4 z-50">
              <button
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full
                  bg-white/10 dark:bg-white/5
                  backdrop-blur-xl
                  border border-white/20 dark:border-white/10
                  flex items-center justify-center
                  shadow-lg
                  transition-transform duration-200
                  hover:scale-105 active:scale-95
                "
                aria-label="Hold to exit fullscreen"
              >
                {/* Progress ring */}
                {isHolding && (
                  <svg
                    className="absolute inset-0 w-full h-full biometric-ring"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      className="stroke-white/20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      className="progress stroke-emerald-500"
                      style={{
                        strokeDashoffset: 283 - (283 * progress) / 100,
                      }}
                    />
                  </svg>
                )}

                {/* Icon */}
                {isHolding ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                )}
              </button>

              {/* Hold instruction */}
              <AnimatePresence>
                {isHolding && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 whitespace-nowrap
                      px-3 py-1.5 rounded-lg
                      bg-black/80 text-white text-xs font-medium
                    "
                  >
                    Hold to exit...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AAC Board */}
            <div className="h-full w-full pt-2">
              <AACBoard
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
