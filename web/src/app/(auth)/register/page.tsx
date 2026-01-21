"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterSchemaWithConfirm } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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

  if (success) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4">
        <Card className="max-w-md mx-auto text-center" hover={false}>
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-[var(--success-light)] rounded-full">
            <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
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
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
            <span className="text-white font-bold text-xl sm:text-2xl">NK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
            Create Account
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base">Join the NeuroKid community</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-[var(--radius-md)]">
            <p className="text-[var(--error)] text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            type="email"
            name="email"
            label="Email Address"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={fieldErrors.email}
            required
          />

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
