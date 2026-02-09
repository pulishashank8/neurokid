"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AACBoard } from "@/features/aac/AACBoard";
import { Maximize2, Minimize2, Clock, LogIn, X } from "lucide-react";
import Link from "next/link";

const DEMO_DURATION_MINUTES = 3;
const DEMO_DURATION_MS = DEMO_DURATION_MINUTES * 60 * 1000;

export default function AACDemoPage() {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DEMO_DURATION_MS);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!mounted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setShowLoginPrompt(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mounted]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
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

  // Format time remaining
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercent = (timeRemaining / DEMO_DURATION_MS) * 100;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading AAC Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)]">
      {/* Demo Banner */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Demo Mode</span>
              <span className="hidden sm:inline text-white/80 text-sm">
                • Try the AAC Communicator free for {DEMO_DURATION_MINUTES} minutes
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4" />
                <span className={`font-mono font-bold ${timeRemaining < 60000 ? 'text-red-100' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-amber-600 text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign Up Free
              </Link>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1 bg-white/20">
            <div 
              className="h-full bg-white transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-12 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="hidden sm:inline font-semibold">NeuroKid</span>
              </Link>
              
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
              
              <h1 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                AAC Communicator Demo
              </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/aac"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Demo</span>
              </Link>
              
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* AAC Board */}
      <div data-testid="aac-board-container" className="h-[calc(100vh-108px)] overflow-hidden">
        <AACBoard 
          onToggleFullscreen={toggleFullscreen} 
          isFullscreen={isFullscreen} 
        />
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Demo Time&apos;s Up!
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You&apos;ve experienced the AAC Communicator. Create a free account to continue using it without limits.
              </p>
              
              <div className="space-y-3">
                <Link
                  href="/register"
                  className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-center transition-all"
                >
                  Create Free Account
                </Link>
                
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-center transition-all"
                >
                  Already have an account? Log in
                </Link>
                
                <button
                  onClick={() => router.push("/")}
                  className="block w-full py-2 text-slate-500 dark:text-slate-500 text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
