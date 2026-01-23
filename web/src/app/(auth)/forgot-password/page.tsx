"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            // We ignore response status/error (unless 429) to prevent enumeration,
            // but if rate limited (429), we might show a message.
            // Usually, just show success.
            if (res.status === 429) {
                setError("Too many requests. Please wait a minute and try again.");
                setIsLoading(false);
                return;
            }

            setSuccess(true);
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen pt-20 px-4">
                <Card className="max-w-md mx-auto text-center" hover={false}>
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Check your email</h2>
                    <p className="text-[var(--muted)] mb-6">
                        If an account exists for <strong>{email}</strong>, we've sent instructions to reset your password.
                    </p>
                    <div className="space-y-4">
                        <Link
                            href="/login"
                            className="block w-full text-center text-sm font-medium text-[var(--primary)] hover:underline"
                        >
                            Back to Login
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 px-4">
            <Card className="max-w-md mx-auto" hover={false}>
                <div className="mb-6">
                    <Link href="/login" className="inline-flex items-center text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Login
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Reset Password</h1>
                    <p className="text-[var(--muted)] text-sm">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-[var(--radius-md)]">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
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
                        icon={<Mail className="w-4 h-4 text-[var(--muted)]" />}
                        required
                    />
                    <Button
                        type="submit"
                        disabled={isLoading}
                        variant="primary"
                        className="w-full"
                    >
                        {isLoading ? "Sending Link..." : "Send Reset Link"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
