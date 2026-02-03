"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AACBoard } from "@/features/aac/AACBoard";
import { Maximize2, Minimize2, Home, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AACAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:inline font-semibold">NeuroKid</span>
              </Link>
              
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
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
              
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-500/25"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* AAC Board */}
      <main className="h-[calc(100vh-64px)] overflow-hidden">
        <AACBoard 
          onToggleFullscreen={toggleFullscreen} 
          isFullscreen={isFullscreen} 
        />
      </main>
    </div>
  );
}
