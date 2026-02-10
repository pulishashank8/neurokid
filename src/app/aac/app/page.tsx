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
  /** Navigation lock (Guided Access style): keeps user on this page, disables nav/settings; communication buttons stay active */
  const [navigationLocked, setNavigationLocked] = useState(false);
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

  const toggleNavigationLock = useCallback(() => {
    setNavigationLocked((prev) => !prev);
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
    <div className={`min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)] ${isFullscreen ? 'fixed inset-0 z-50' : 'pt-28'}`}>
      {/* Header - When navigation locked: only title + Unlock button; otherwise full nav */}
      <header className={`sticky top-28 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-transform ${isFullscreen ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back (when unlocked) + Title */}
            <div className="flex items-center gap-4">
              {!navigationLocked && <BackButton fallbackPath="/dashboard" />}

              {!navigationLocked && (
                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" aria-hidden />
              )}

              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-white">
                  AAC Communicator
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  Beta
                </span>
              </div>
            </div>

            {/* Right: Unlock (when locked) or Lock + Dashboard + Focus (when unlocked) */}
            <div className="flex items-center gap-2">
              {/* Lock / Unlock - always visible; when locked this is the only way out */}
              <button
                onClick={toggleNavigationLock}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm font-semibold transition-colors touch-manipulation min-h-[44px] ${navigationLocked
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20"
                  }`}
                title={navigationLocked ? "Unlock (restore navigation)" : "Lock navigation (Guided Access)"}
                aria-label={navigationLocked ? "Unlock navigation" : "Lock navigation"}
              >
                {navigationLocked ? (
                  <>
                    <Unlock className="w-4 h-4 shrink-0" />
                    <span className="inline">Unlock</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Lock</span>
                  </>
                )}
              </button>

              {!navigationLocked && (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>

                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-500/25 touch-manipulation"
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* AAC Board - communication stays active; nav/settings restricted when navigationLocked */}
      <main className={`overflow-hidden ${isFullscreen ? 'h-screen' : 'h-[calc(100dvh-176px)] sm:h-[calc(100dvh-192px)]'} pb-safe`}>
        <AACBoard
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          navigationLocked={navigationLocked}
          onToggleNavigationLock={toggleNavigationLock}
        />
      </main>
    </div>
  );
}
