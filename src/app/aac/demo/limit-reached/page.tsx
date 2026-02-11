"use client";

import Link from "next/link";
import { Clock, LogIn, UserPlus, Home } from "lucide-react";

export default function AACDemoLimitReachedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Demo Limit Reached
          </h1>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You&apos;ve already tried the AAC Communicator demo twice. Create a free
            account to keep using it without limits—no credit card required.
          </p>

          <div className="space-y-3">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Create Free Account
            </Link>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold transition-all"
            >
              <LogIn className="w-4 h-4" />
              Already have an account? Log in
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-2 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
