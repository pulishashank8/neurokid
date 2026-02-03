"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
            <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden flex flex-col items-center justify-center">
                {/* Background Orbs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-900/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                </div>

                <Card variant="premium" className="max-w-md w-full mx-auto p-10 text-center relative z-10 card-lift animate-scale-in">
                    <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full shadow-lg shadow-emerald-500/20">
                        <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-[var(--text)] mb-4 leading-tight">Check your email</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        If an account exists for <strong className="text-[var(--text)]">{email}</strong>, we've sent instructions to reset your password.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center w-full py-4 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all duration-300"
                    >
                        Back to Login
                    </Link>
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
            </div>

            <Card variant="premium" className="max-w-md w-full mx-auto p-8 sm:p-12 relative z-10 card-lift animate-scale-in">
                <div className="mb-8">
                    <Link href="/login" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-emerald-500 transition-colors mb-6 group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                    <h1 className="text-3xl font-extrabold text-[var(--text)] mb-3 leading-tight">Reset Password</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-500/20 rounded-2xl animate-shake">
                        <p className="text-rose-800 dark:text-rose-400 text-sm font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                        <div className="relative">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-5 py-4 pl-12 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all duration-300 text-base"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Mail className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        variant="default"
                        className="w-full py-7 text-lg font-extrabold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-1 active:scale-95 transition-all duration-300"
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
