"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`/api/auth/verify-email?token=${token}`);
                if (!res.ok) throw new Error("Verification failed");
                setStatus("success");
                setTimeout(() => router.push("/login?verified=1"), 2000);
            } catch (err) {
                setStatus("error");
            }
        };

        verify();
    }, [token, router]);

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-[var(--text)]">Verifying your email...</h2>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-[var(--text)]">Email Verified!</h2>
                <p className="text-[var(--muted)] mb-6">Thank you for verifying your email.</p>
                <p className="text-sm text-[var(--muted)]">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[var(--text)]">Verification Failed</h2>
            <p className="text-[var(--muted)] mb-6">This link may be invalid or expired.</p>
            <Button onClick={() => router.push("/login")}>Back to Login</Button>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen pt-20 px-4">
            <Card className="max-w-md mx-auto" hover={false}>
                <Suspense fallback={<div>Loading...</div>}>
                    <VerifyEmailContent />
                </Suspense>
            </Card>
        </div>
    );
}
