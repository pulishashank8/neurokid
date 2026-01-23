"use client";

import { useState, FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoginSchema } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);

  const verified = searchParams.get("verified") === "1";
  const resetSuccess = searchParams.get("reset") === "1";
  const errorParam = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResend(false);
    setIsLoading(true);

    try {
      // Validate input
      const parsed = LoginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message || "Invalid input");
        setIsLoading(false);
        return;
      }

      // Sign in with credentials
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        if (result?.error === "EmailNotVerified" || result?.error?.includes("not verified")) {
          setError("Please verify your email before logging in.");
          setShowResend(true);
        } else {
          setError(result?.error || "Invalid email or password");
        }
        setIsLoading(false);
        return;
      }

      // Redirect to callback URL
      router.push(callbackUrl);
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto" hover={false}>
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
          <span className="text-white font-bold text-xl sm:text-2xl">NK</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
          Welcome Back!
        </h1>
        <p className="text-[var(--muted)] text-sm sm:text-base">Sign in to NeuroKid</p>
      </div>

      {verified && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-[var(--radius-md)] flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-green-600 text-xs font-bold">✓</span>
          </div>
          <p className="text-green-700 dark:text-green-300 text-sm font-medium">Email verified successfully! Please sign in.</p>
        </div>
      )}

      {resetSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-[var(--radius-md)] flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-green-600 text-xs font-bold">✓</span>
          </div>
          <p className="text-green-700 dark:text-green-300 text-sm font-medium">Password reset successfully. Please login.</p>
        </div>
      )}

      {errorParam === "InvalidToken" && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-[var(--radius-md)]">
          <p className="text-red-600 dark:text-red-400 text-sm">Invalid verification link.</p>
        </div>
      )}

      {errorParam === "TokenExpired" && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-[var(--radius-md)]">
          <p className="text-red-600 dark:text-red-400 text-sm">Verification link expired. Please log in to resend.</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-[var(--radius-md)]">
          <p className="text-[var(--error)] text-sm">{error}</p>
          {showResend && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              {resendStatus === "success" ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-green-600 text-sm">Verification email sent! Check your inbox.</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) return;
                    setResendStatus("loading");
                    try {
                      const res = await fetch("/api/auth/resend-verification", {
                        method: "POST",
                        body: JSON.stringify({ email }),
                        headers: { "Content-Type": "application/json" }
                      });
                      if (res.ok) setResendStatus("success");
                      else setResendStatus("error");
                    } catch {
                      setResendStatus("error");
                    }
                  }}
                  disabled={resendStatus === "loading"}
                  className="text-sm font-medium underline text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                >
                  {resendStatus === "loading" ? "Sending..." : "Resend Verification Email"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="email"
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <Input
          id="password"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <div className="flex justify-end mt-1">
          <Link href="/forgot-password" className="text-sm font-medium text-[var(--primary)] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="primary"
          className="w-full mt-6"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      {/* Google Sign In */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-light)]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-[var(--surface)] text-[var(--muted)]">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--border-light)] rounded-[var(--radius-md)] bg-white hover:bg-gray-50 transition-colors text-[var(--text-primary)] font-medium min-h-[48px]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-[var(--muted)] text-sm">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold"
          >
            Create one
          </Link>
        </p>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <Suspense fallback={
        <Card className="max-w-md mx-auto" hover={false}>
          <div className="text-center">
            <div className="skeleton h-8 w-48 mx-auto mb-4"></div>
            <div className="skeleton h-4 w-32 mx-auto"></div>
          </div>
        </Card>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
