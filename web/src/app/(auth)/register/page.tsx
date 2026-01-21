"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterSchemaWithConfirm } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";

type Step = "email" | "otp" | "details";

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send verification code");
        setIsLoading(false);
        return;
      }

      setOtpSent(true);
      setCurrentStep("otp");
      setIsLoading(false);
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid verification code");
        setIsLoading(false);
        return;
      }

      setCurrentStep("details");
      setIsLoading(false);
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Step 3: Complete Registration
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
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4">
        <Card className="max-w-md mx-auto text-center" hover={false}>
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Registration Successful!</h2>
          <p className="text-[var(--muted)]">Your account has been created. Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <Card className="max-w-md mx-auto" hover={false}>
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
            <span className="text-white font-bold text-xl sm:text-2xl">NK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
            Create Account
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base">Join the NeuroKid community</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === "email" ? "bg-[var(--primary)] text-white" : currentStep === "otp" || currentStep === "details" ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-[var(--surface2)] text-[var(--muted)]"}`}>
            {currentStep === "otp" || currentStep === "details" ? "✓" : "1"}
          </div>
          <div className={`w-12 h-1 ${currentStep === "otp" || currentStep === "details" ? "bg-green-500" : "bg-[var(--surface2)]"}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === "otp" ? "bg-[var(--primary)] text-white" : currentStep === "details" ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-[var(--surface2)] text-[var(--muted)]"}`}>
            {currentStep === "details" ? "✓" : "2"}
          </div>
          <div className={`w-12 h-1 ${currentStep === "details" ? "bg-green-500" : "bg-[var(--surface2)]"}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === "details" ? "bg-[var(--primary)] text-white" : "bg-[var(--surface2)] text-[var(--muted)]"}`}>
            3
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-[var(--radius-md)]">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Email Input */}
        {currentStep === "email" && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoFocus
              />
              <p className="mt-2 text-xs text-[var(--muted)]">
                We'll send a verification code to this email
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.email}
              variant="primary"
              className="w-full mt-6 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                "Sending Code..."
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {currentStep === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mb-3">
                <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-[var(--text)] mb-1">Check your email</h3>
              <p className="text-sm text-[var(--muted)]">
                We sent a 6-digit code to<br />
                <span className="font-medium text-[var(--text)]">{formData.email}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="mt-2 text-xs text-[var(--muted)]">
                Expires in 10 minutes
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || formData.otp.length !== 6}
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoading ? "Verifying..." : <>Verify Code <ArrowRight className="w-4 h-4" /></>}
            </Button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep("email");
                setFormData({ ...formData, otp: "" });
                setError(null);
              }}
              className="w-full text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
            >
              ← Change email address
            </button>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
            >
              Resend code
            </button>
          </form>
        )}

        {/* Step 3: Complete Registration */}
        {currentStep === "details" && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Email verified! Complete your profile below.
              </p>
            </div>

            <Input
              id="username"
              type="text"
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              placeholder="your_username"
              error={fieldErrors.username}
              required
              autoFocus
            />

            <Input
              id="displayName"
              type="text"
              name="displayName"
              label="Display Name"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Your Full Name"
              error={fieldErrors.displayName}
              required
            />

            <Input
              id="password"
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              error={fieldErrors.password}
              required
            />

            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              error={fieldErrors.confirmPassword}
              required
            />

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full mt-6"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[var(--muted)] text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
