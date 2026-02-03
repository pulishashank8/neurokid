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
import { Eye, EyeOff, Check } from "lucide-react";

// Floating animated orbs background for Auth pages
function authFloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-900/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-400/5 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
    </div>
  );
}

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

      <Card variant="premium" className="max-w-md w-full mx-auto p-8 sm:p-12 card-lift animate-scale-in relative z-10" hover={false}>
        <div className="text-center mb-8 relative">
          {/* Animated Mascot */}
          <div className="mx-auto mb-6 animate-mascot-idle mascot-glow" style={{ width: '160px', height: '140px' }}>
            <AnimatedMascot
              state={mascotState}
              emailLength={email.length}
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Welcome Back!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium animate-slide-up" style={{ animationDelay: '200ms' }}>
            Sign in to your NeuroKid account
          </p>
        </div>

        {/* Status Messages (verified, error, etc.) */}
        <div className="space-y-4 mb-8">
          {verified && (
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-slide-in-left">
              <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-400/30">
                <Check className="text-white w-4 h-4" />
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 text-sm font-semibold">Email verified! You can now sign in.</p>
            </div>
          )}

          {resetSuccess && (
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-slide-in-left">
              <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-400/30">
                <Check className="text-white w-4 h-4" />
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 text-sm font-semibold">Password reset successful!</p>
            </div>
          )}

          {errorParam === "InvalidToken" && (
            <div className="p-4 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-500/20 rounded-2xl animate-shake">
              <p className="text-rose-800 dark:text-rose-300 text-sm font-medium">Invalid verification link.</p>
            </div>
          )}

          {errorParam === "TokenExpired" && (
            <div className="p-4 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-500/20 rounded-2xl animate-shake">
              <p className="text-rose-800 dark:text-rose-300 text-sm font-medium">Verification link expired. Please log in to resend.</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-500/20 rounded-2xl animate-shake">
              <p className="text-rose-800 dark:text-rose-300 text-sm font-medium">{error}</p>
              {showResend && (
                <div className="mt-3 pt-3 border-t border-rose-200/50 dark:border-rose-800/20">
                  {resendStatus === "success" ? (
                    <div className="flex items-center gap-2">
                      <Check className="text-emerald-600 w-4 h-4" />
                      <p className="text-emerald-600 text-sm font-medium">Verification email sent! Check your inbox.</p>
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
                      className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      {resendStatus === "loading" ? "Sending..." : "Resend Verification Email"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setMascotState("watching")}
              onBlur={() => setMascotState("idle")}
              placeholder="you@example.com"
              required
              className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base"
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex justify-between mb-2 ml-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setMascotState("hiding")}
                onBlur={() => setMascotState("idle")}
                placeholder="••••••••"
                required
                className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <Button
              type="submit"
              disabled={isLoading}
              variant="default"
              className="w-full py-7 text-lg font-extrabold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-1 active:scale-95 transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-rotate w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </Button>
          </div>
        </form>

        <div className="mt-10 animate-slide-up" style={{ animationDelay: '450ms' }}>
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200/50 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="px-4 bg-transparent text-gray-400 backdrop-blur-sm">OR</span>
            </div>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transform hover:-translate-y-0.5 transition-all duration-300 text-gray-700 dark:text-gray-200 font-bold shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200/50 dark:border-white/10 text-center animate-slide-up" style={{ animationDelay: '500ms' }}>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline transition-all ml-1"
            >
              Create Account Now
            </Link>
          </p>
        </div>
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-900/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/5 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      <Suspense fallback={
        <Card variant="premium" className="max-w-md mx-auto p-10 relative z-10" hover={false}>
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
