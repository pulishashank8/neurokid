"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AACBoard } from "@/features/aac/AACBoard";
import { Maximize2, Minimize2, Home, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";

export default function AACAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/aac/app");
    }
  }, [status, router]);

  const toggleFullscreen = useCallback(() => {
    // On mobile, Fullscreen API doesn't work (especially iOS)
    // Instead, we'll use a CSS-based "Focus Mode"
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Just toggle the state for CSS-based focus mode
      setIsFullscreen((prev) => !prev);
    } else {
      // On desktop, try native fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => {
          // Fallback: just toggle the state for UI purposes
          setIsFullscreen((prev) => !prev);
        });
      } else {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      }
    }
  }, []);

  const toggleLock = useCallback(() => {
    setIsLocked((prev) => !prev);
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading AAC Communicator...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)] ${isFullscreen ? 'fixed inset-0 z-50' : 'pt-20'}`}>
      {/* Header - Hidden in focus mode */}
      <header className={`sticky top-20 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-transform ${isFullscreen ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <BackButton fallbackPath="/dashboard" disabled={isLocked} />

              <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-white">
                  AAC Communicator
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  Beta
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Lock/Unlock Button - Navigation lock: tap to unlock when locked */}
              <button
                onClick={toggleLock}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm font-medium transition-colors touch-manipulation ${isLocked
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20"
                  }`}
                title={isLocked ? "Unlock (restore navigation)" : "Lock (restrict navigation)"}
              >
                {isLocked ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span className="hidden sm:inline">Unlock</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span className="hidden sm:inline">Lock</span>
                  </>
                )}
              </button>

              {!isLocked && (
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
              )}

              <button
                onClick={toggleFullscreen}
                disabled={isLocked}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-500/25 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Exit Focus</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Focus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* AAC Board - Use dvh for proper mobile viewport */}
      <main className={`overflow-hidden ${isFullscreen ? 'h-screen' : 'h-[calc(100dvh-144px)] sm:h-[calc(100dvh-160px)]'} pb-safe`}>
        <AACBoard
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          isLocked={isLocked}
          onToggleLock={toggleLock}
        />
      </main>
    </div>
  );
}
