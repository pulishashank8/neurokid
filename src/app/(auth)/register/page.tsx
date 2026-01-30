"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterSchemaWithConfirm } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { AnimatedMascot, MascotState } from "@/components/ui/AnimatedMascot";
import { Mail, Eye, EyeOff } from "lucide-react";

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
      <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden">
        <Card className="max-w-md mx-auto text-center card-lift animate-scale-in" hover={false}>
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
    <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden">
      <Card className="max-w-md mx-auto card-lift animate-scale-in relative" hover={false}>
        <div className="text-center mb-6 sm:mb-8">
          {/* Animated Mascot */}
          <div className="mx-auto mb-4 animate-mascot-idle mascot-glow" style={{ width: '140px', height: '130px' }}>
            <AnimatedMascot
              state={mascotState}
              emailLength={formData.email.length}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Create Account
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base animate-slide-up" style={{ animationDelay: '150ms' }}>Join the NeuroKid community</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-[var(--radius-md)] animate-shake">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Input
              id="email"
              type="email"
              name="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setMascotState("watching")}
              onBlur={() => setMascotState("idle")}
              placeholder="you@example.com"
              error={fieldErrors.email}
              required
              autoFocus
              className="transition-all duration-300 focus:scale-[1.01]"
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <Input
              id="username"
              type="text"
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              onFocus={() => setMascotState("watching")}
              onBlur={() => setMascotState("idle")}
              placeholder="your_username"
              error={fieldErrors.username}
              required
              className="transition-all duration-300 focus:scale-[1.01]"
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Input
              id="displayName"
              type="text"
              name="displayName"
              label="Display Name"
              value={formData.displayName}
              onChange={handleChange}
              onFocus={() => setMascotState("watching")}
              onBlur={() => setMascotState("idle")}
              placeholder="Your Full Name"
              error={fieldErrors.displayName}
              required
              className="transition-all duration-300 focus:scale-[1.01]"
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '350ms' }}>
            <label className="block text-sm font-semibold text-[var(--text)] mb-2">
              Password
            </label>
            <div className="relative group">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setMascotState("hiding")}
                onBlur={() => setMascotState("idle")}
                placeholder="••••••••"
                required
                className={`
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
                  ${fieldErrors.password ? "border-[var(--error)]" : ""}
                `}
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
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-[var(--error)] animate-shake">{fieldErrors.password}</p>
            )}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <label className="block text-sm font-semibold text-[var(--text)] mb-2">
              Confirm Password
            </label>
            <div className="relative group">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setMascotState("hiding")}
                onBlur={() => setMascotState("idle")}
                placeholder="••••••••"
                required
                className={`
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
                  ${fieldErrors.confirmPassword ? "border-[var(--error)]" : ""}
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors p-1"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-[var(--error)] animate-shake">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '450ms' }}>
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
                  Creating Account...
                </span>
              ) : "Create Account"}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '500ms' }}>
          <p className="text-[var(--muted)] text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
