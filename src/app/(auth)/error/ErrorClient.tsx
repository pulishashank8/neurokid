"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link is no longer valid. It may have expired.",
    Default: "An error occurred while signing in.",
    OAuthSignin: "Error signing in with the OAuth provider.",
    OAuthCallback: "Error in the OAuth callback process.",
    OAuthCreateAccount: "Could not create OAuth account.",
    EmailCreateAccount: "Could not create email account.",
    Callback: "Error in the callback process.",
    OAuthAccountNotLinked: "This email is already associated with another account.",
    SessionRequired: "Please sign in to access this page.",
    CredentialsSignin: "Invalid email or password. Please try again.",
    TooManyAttempts: "Too many login attempts. Please wait a minute before trying again.",
    EmailNotVerified: "Please verify your email address before signing in. Check your inbox for the verification link.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/10 dark:bg-rose-900/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 glass shadow-premium p-10 rounded-3xl animate-scale-in">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-100 dark:bg-rose-900/30 shadow-lg shadow-rose-500/10">
            <svg
              className="h-10 w-10 text-rose-600 dark:text-rose-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-8 text-3xl font-extrabold text-[var(--text)] leading-tight">
            Authentication Error
          </h2>
          <p className="mt-4 text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            {errorMessage}
          </p>
          {error && (
            <div className="mt-4 py-1 px-3 bg-rose-50/50 dark:bg-rose-900/20 rounded-full inline-block">
              <p className="text-xs font-bold text-rose-500">
                ERROR CODE: {error}
              </p>
            </div>
          )}
        </div>
        <div className="mt-10 space-y-4">
          <Link
            href="/login"
            className="flex w-full justify-center py-4 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all duration-300"
          >
            Back to Sign In
          </Link>
          <Link
            href="/"
            className="flex w-full justify-center py-4 text-base font-bold text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-2xl hover:bg-white transition-all duration-300 shadow-sm"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ErrorClient() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
