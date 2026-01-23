"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Lock, CheckCircle } from "lucide-react";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="text-center">
                <h2 className="text-xl font-bold text-[var(--error)] mb-2">Invalid Link</h2>
                <p className="text-[var(--muted)] mb-4">This password reset link is missing required information.</p>
                <Button onClick={() => router.push("/forgot-password")}>Request New Link</Button>
            </div>
        );
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password, confirmPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to reset password");
                setIsLoading(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/login?reset=1");
            }, 3000);
        } catch (err) {
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Password Reset Successful!</h2>
                <p className="text-[var(--muted)] mb-6">
                    Your password has been updated. Redirecting to login...
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Set New Password</h1>
                <p className="text-[var(--muted)] text-sm">Please enter a new strong password for your account.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-[var(--radius-md)]">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="password"
                    type="password"
                    label="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4 text-[var(--muted)]" />}
                    required
                />
                <Input
                    id="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4 text-[var(--muted)]" />}
                    required
                />

                <div className="text-xs text-[var(--muted)] mb-4">
                    Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    variant="primary"
                    className="w-full"
                >
                    {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen pt-20 px-4">
            <Card className="max-w-md mx-auto" hover={false}>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordContent />
                </Suspense>
            </Card>
        </div>
    );
}
