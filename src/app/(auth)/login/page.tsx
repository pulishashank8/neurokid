"use client";

import { useState, FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LoginSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AnimatedMascot, MascotState } from "@/components/ui/AnimatedMascot";
import { Eye, EyeOff } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>("idle");

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
    <>
      {/* NeuroKid Logo - outside card, just above it */}
      <Link href="/" className="flex items-center justify-center gap-4 mb-3">
        <Image
          src="/logo-icon.png"
          alt="NeuroKid Logo"
          width={72}
          height={72}
          className="w-16 h-16 sm:w-[72px] sm:h-[72px]"
        />
        <span className="text-3xl sm:text-4xl font-bold text-[var(--primary)]">NeuroKid</span>
      </Link>

      <Card className="max-w-md mx-auto card-lift animate-scale-in" hover={false}>
        <div className="text-center mb-6 sm:mb-8 relative">
          {/* Animated Mascot */}
          <div className="mx-auto mb-4 animate-mascot-idle mascot-glow" style={{ width: '140px', height: '130px' }}>
            <AnimatedMascot
              state={mascotState}
              emailLength={email.length}
            />
          </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          Welcome Back!
        </h1>
        <p className="text-[var(--muted)] text-sm sm:text-base animate-slide-up" style={{ animationDelay: '200ms' }}>Sign in to NeuroKid</p>
      </div>

      {verified && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-[var(--radius-md)] flex items-center gap-3 animate-slide-in-left">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-green-600 text-xs font-bold">✓</span>
          </div>
          <p className="text-green-700 dark:text-green-300 text-sm font-medium">Email verified successfully! Please sign in.</p>
        </div>
      )}

      {resetSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-[var(--radius-md)] flex items-center gap-3 animate-slide-in-left">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-green-600 text-xs font-bold">✓</span>
          </div>
          <p className="text-green-700 dark:text-green-300 text-sm font-medium">Password reset successfully. Please login.</p>
        </div>
      )}

      {errorParam === "InvalidToken" && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-[var(--radius-md)] animate-shake">
          <p className="text-red-600 dark:text-red-400 text-sm">Invalid verification link.</p>
        </div>
      )}

      {errorParam === "TokenExpired" && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-[var(--radius-md)] animate-shake">
          <p className="text-red-600 dark:text-red-400 text-sm">Verification link expired. Please log in to resend.</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-[var(--radius-md)] animate-shake">
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
                  className="text-sm font-medium underline text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200 transition-colors"
                >
                  {resendStatus === "loading" ? "Sending..." : "Resend Verification Email"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          <Input
            id="email"
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setMascotState("watching")}
            onBlur={() => setMascotState("idle")}
            placeholder="you@example.com"
            required
            className="transition-all duration-300 focus:scale-[1.01]"
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <label className="block text-sm font-semibold text-[var(--text)] mb-2">
            Password
          </label>
          <div className="relative group">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setMascotState("hiding")}
              onBlur={() => setMascotState("idle")}
              placeholder="••••••••"
              required
              className="
                bg-[var(--surface)]
                border-2 border-[var(--border)]
                text-[var(--text)]
                placeholder:text-[var(--muted)]
                rounded-[var(--radius-md)]
                px-4 py-3
                pr-12
                w-full
                min-h-[48px]
                text-base
                transition-all duration-300
                hover:border-[var(--primary)]
                focus:border-[var(--primary)]
                focus:outline-none
                focus:shadow-[0_0_0_3px_var(--focus-ring)]
                focus:scale-[1.01]
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-1 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <Link href="/forgot-password" className="text-sm font-medium text-[var(--primary)] hover:underline hover:text-[var(--primary-hover)] transition-colors">
            Forgot password?
          </Link>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="w-full mt-6 btn-ripple btn-premium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-rotate w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Signing in...
              </span>
            ) : "Sign In"}
          </Button>
        </div>
      </form>

      {/* Google Sign In */}
      <div className="mt-6 animate-slide-up" style={{ animationDelay: '450ms' }}>
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
          className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--border-light)] rounded-[var(--radius-md)] bg-white hover:bg-gray-50 dark:bg-[var(--surface)] dark:hover:bg-[var(--surface2)] transition-all duration-300 text-[var(--text-primary)] font-medium min-h-[48px] hover:scale-[1.02] hover:shadow-md btn-ripple"
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

      <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '500ms' }}>
        <p className="text-[var(--muted)] text-sm">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden">
      <Suspense fallback={
        <Card className="max-w-md mx-auto" hover={false}>
          <div className="text-center">
            <div className="skeleton h-20 w-20 mx-auto mb-4 rounded-2xl"></div>
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
