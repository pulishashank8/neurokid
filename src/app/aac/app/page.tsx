"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AACBoard } from "@/features/aac/AACBoard";
import { Maximize2, Minimize2, Home, Sparkles, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";

export default function AACAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockCode, setUnlockCode] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // The unlock pattern: tap the corners in order (TL, TR, BR, BL)
  const UNLOCK_PATTERN = ["TL", "TR", "BR", "BL"];

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
    if (isLocked) {
      // Show unlock interface
      setUnlockCode([]);
    } else {
      setIsLocked(true);
    }
  }, [isLocked]);

  const handleUnlockTap = useCallback((corner: string) => {
    const newCode = [...unlockCode, corner];
    setUnlockCode(newCode);

    // Check if pattern matches
    if (newCode.length === UNLOCK_PATTERN.length) {
      const isCorrect = newCode.every((c, i) => c === UNLOCK_PATTERN[i]);
      if (isCorrect) {
        setIsLocked(false);
        setUnlockCode([]);
      } else {
        // Wrong pattern, reset
        setUnlockCode([]);
      }
    }
  }, [unlockCode]);

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
      {/* Lock Overlay */}
      {isLocked && (
        <div className="fixed inset-0 z-[200] bg-gradient-to-br from-emerald-900/95 to-teal-900/95 backdrop-blur-sm flex flex-col">
          {/* Unlock instruction */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
            <Lock className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Screen Locked</h2>
            <p className="text-white/70 text-sm max-w-xs mx-auto">
              Tap the corners in order to unlock:<br />
              <span className="font-mono text-emerald-300">Top-Left → Top-Right → Bottom-Right → Bottom-Left</span>
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {UNLOCK_PATTERN.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${i < unlockCode.length ? 'bg-emerald-400' : 'bg-white/30'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Corner tap areas - made larger for mobile */}
          <button
            onClick={() => handleUnlockTap("TL")}
            className="absolute top-0 left-0 w-32 h-32 sm:w-24 sm:h-24 hover:bg-white/10 transition-colors rounded-br-3xl touch-manipulation"
            aria-label="Top left corner"
          />
          <button
            onClick={() => handleUnlockTap("TR")}
            className="absolute top-0 right-0 w-32 h-32 sm:w-24 sm:h-24 hover:bg-white/10 transition-colors rounded-bl-3xl touch-manipulation"
            aria-label="Top right corner"
          />
          <button
            onClick={() => handleUnlockTap("BR")}
            className="absolute bottom-0 right-0 w-32 h-32 sm:w-24 sm:h-24 hover:bg-white/10 transition-colors rounded-tl-3xl touch-manipulation"
            aria-label="Bottom right corner"
          />
          <button
            onClick={() => handleUnlockTap("BL")}
            className="absolute bottom-0 left-0 w-32 h-32 sm:w-24 sm:h-24 hover:bg-white/10 transition-colors rounded-tr-3xl touch-manipulation"
            aria-label="Bottom left corner"
          />

          {/* Visual corner indicators */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-emerald-400/50 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-emerald-400/50 rounded-tr-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-emerald-400/50 rounded-br-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-emerald-400/50 rounded-bl-lg" />
        </div>
      )}

      {/* Header - Hidden in focus mode on mobile */}
      <header className={`sticky top-28 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-transform ${isFullscreen ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <BackButton fallbackPath="/dashboard" />

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
              {/* Lock Button */}
              <button
                onClick={toggleLock}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm font-medium transition-colors touch-manipulation ${isLocked
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20"
                  }`}
                title={isLocked ? "Unlock screen" : "Lock screen"}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span className="hidden sm:inline">Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span className="hidden sm:inline">Lock</span>
                  </>
                )}
              </button>

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
            </div>
          </div>
        </div>
      </header>

      {/* AAC Board - Use dvh for proper mobile viewport */}
      <main className={`overflow-hidden ${isFullscreen ? 'h-screen' : 'h-[calc(100dvh-176px)] sm:h-[calc(100dvh-192px)]'} pb-safe`}>
        <AACBoard
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      </main>
    </div>
  );
}
