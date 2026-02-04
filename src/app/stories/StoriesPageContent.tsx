"use client";

import { useSession } from "next-auth/react";
import { StoriesLandingContent } from "./StoriesLandingContent";
import { StoryAssistant } from "@/features/stories/StoryAssistant";
import { Home, Sparkles } from "lucide-react";
import Link from "next/link";

export function StoriesPageContent() {
  const { data: session, status } = useSession();

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show landing page
  if (status === "unauthenticated" || !session) {
    return <StoriesLandingContent />;
  }

  // If logged in, show the full stories & rhymes interface
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:inline font-semibold">NeuroKid</span>
              </Link>

              <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-white">
                  Stories & Rhymes
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium">
                  Interactive
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StoryAssistant />
      </main>
    </div>
  );
}
