"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
            <div className="text-center py-10">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-[var(--text)] mb-4 leading-tight">Password Reset Successful!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    Your password has been updated. Redirecting to login...
                </p>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[progress_3s_linear_forwards]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-[var(--text)] mb-3 leading-tight">Set New Password</h1>
                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">Please enter a new strong password for your account.</p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-500/20 rounded-2xl animate-shake">
                    <p className="text-rose-800 dark:text-rose-400 text-sm font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">New Password</label>
                    <div className="relative group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-5 py-4 pl-12 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Confirm Password</label>
                    <div className="relative group">
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-5 py-4 pl-12 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-200/30 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
                    Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    variant="default"
                    className="w-full py-7 text-lg font-extrabold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-1 active:scale-95 transition-all duration-300"
                >
                    {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden flex flex-col items-center justify-center">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-900/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <Card variant="premium" className="max-w-md w-full mx-auto p-8 sm:p-12 relative z-10 card-lift animate-scale-in">
                <Suspense fallback={
                    <div className="text-center py-10">
                        <div className="skeleton w-20 h-20 rounded-full mx-auto mb-6"></div>
                        <div className="skeleton w-48 h-8 rounded-lg mx-auto mb-4"></div>
                        <div className="skeleton w-32 h-4 rounded-lg mx-auto"></div>
                    </div>
                }>
                    <ResetPasswordContent />
                </Suspense>
            </Card>
        </div>
    );
}
