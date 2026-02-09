"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterSchemaWithConfirm } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AnimatedMascot, MascotState } from "@/components/ui/AnimatedMascot";
import { CaptchaWidget } from "@/components/captcha";
import { HoneypotField } from "@/components/security/HoneypotField";
import { isCaptchaEnabled } from "@/lib/captcha-client";
import { Mail, Eye, EyeOff, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors
    setError(null);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Validate input
      const parsed = RegisterSchemaWithConfirm.safeParse(formData);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        parsed.error.errors.forEach((err) => {
          const path = err.path[0] as string;
          errors[path] = err.message;
        });
        setFieldErrors(errors);
        setIsLoading(false);
        return;
      }

      // Check if CAPTCHA is required
      const captchaRequired = await isCaptchaEnabled();
      if (captchaRequired && !captchaToken) {
        setError("Please complete the CAPTCHA verification");
        setCaptchaError("CAPTCHA verification required");
        setIsLoading(false);
        return;
      }

      // Call registration API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          username: formData.username,
          displayName: formData.displayName,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const errors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            const path = err.path[0] as string;
            errors[path] = err.message;
          });
          setFieldErrors(errors);
        } else {
          setError(data.error || "Registration failed");
        }
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Background Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-900/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <Card variant="premium" className="max-w-md mx-auto p-10 text-center card-lift animate-scale-in relative z-10" hover={false}>
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full animate-logo-bounce">
            <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>Check your email</h2>
          <p className="text-[var(--muted)] mb-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            We've sent a verification link to <strong className="text-[var(--text)]">{formData.email}</strong>.
          </p>
          <p className="text-[var(--muted)] text-sm mb-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            Please check your inbox (and spam folder) to verify your account before logging in.
          </p>
          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <Button onClick={() => router.push("/login")} className="btn-ripple btn-premium">
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-900/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/5 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      <Card variant="premium" className="max-w-md w-full mx-auto p-8 sm:p-12 card-lift animate-scale-in relative z-10" hover={false}>
        <div className="text-center mb-8">
          {/* Animated Mascot */}
          <div className="mx-auto mb-6 animate-mascot-idle mascot-glow" style={{ width: '160px', height: '140px' }}>
            <AnimatedMascot
              state={mascotState}
              emailLength={formData.email.length}
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Create Account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium animate-slide-up" style={{ animationDelay: '150ms' }}>Join the NeuroKid community</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-500/20 rounded-2xl animate-shake">
            <p className="text-rose-800 dark:text-rose-300 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Honeypot field - invisible to humans, catches bots */}
          <HoneypotField fieldName="website" label="Website" />
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setMascotState("watching")}
              onBlur={() => setMascotState("idle")}
              placeholder="you@example.com"
              required
              className={`w-full px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border ${fieldErrors.email ? "border-rose-400" : "border-gray-200/50 dark:border-white/10"} focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base`}
            />
            {fieldErrors.email && <p className="mt-1 ml-1 text-xs font-bold text-rose-500">{fieldErrors.email}</p>}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onFocus={() => setMascotState("watching")}
              onBlur={() => setMascotState("idle")}
              placeholder="your_username"
              required
              className={`w-full px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border ${fieldErrors.username ? "border-rose-400" : "border-gray-200/50 dark:border-white/10"} focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base`}
            />
            {fieldErrors.username && <p className="mt-1 ml-1 text-xs font-bold text-rose-500">{fieldErrors.username}</p>}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              onFocus={() => setMascotState("watching")}
              onBlur={() => setMascotState("idle")}
              placeholder="Your Full Name"
              required
              className={`w-full px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border ${fieldErrors.displayName ? "border-rose-400" : "border-gray-200/50 dark:border-white/10"} focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base`}
            />
            {fieldErrors.displayName && <p className="mt-1 ml-1 text-xs font-bold text-rose-500">{fieldErrors.displayName}</p>}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '350ms' }}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Password
            </label>
            <div className="relative group">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setMascotState("hiding")}
                onBlur={() => setMascotState("idle")}
                placeholder="••••••••"
                required
                className={`w-full px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border ${fieldErrors.password ? "border-rose-400" : "border-gray-200/50 dark:border-white/10"} focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 ml-1 text-xs font-bold text-rose-500">{fieldErrors.password}</p>}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setMascotState("hiding")}
                onBlur={() => setMascotState("idle")}
                placeholder="••••••••"
                required
                className={`w-full px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border ${fieldErrors.confirmPassword ? "border-rose-400" : "border-gray-200/50 dark:border-white/10"} focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="mt-1 ml-1 text-xs font-bold text-rose-500">{fieldErrors.confirmPassword}</p>}
          </div>

          {/* CAPTCHA Widget */}
          <div className="animate-slide-up" style={{ animationDelay: '440ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Security Verification
              </label>
            </div>
            <CaptchaWidget
              onVerify={(token) => {
                setCaptchaToken(token);
                setCaptchaError(null);
              }}
              onError={(error) => {
                setCaptchaError(error);
                setCaptchaToken(null);
              }}
              onExpire={() => {
                setCaptchaToken(null);
              }}
              theme="light"
            />
            {captchaError && (
              <p className="mt-1 ml-1 text-xs font-bold text-rose-500">{captchaError}</p>
            )}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '480ms' }}>
            <Button
              type="submit"
              disabled={isLoading}
              variant="default"
              className="w-full mt-6 py-7 text-lg font-extrabold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-1 active:scale-95 transition-all duration-300"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200/50 dark:border-white/10 text-center animate-slide-up" style={{ animationDelay: '500ms' }}>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline transition-all ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
