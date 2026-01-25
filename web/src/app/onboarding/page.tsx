"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user && (session.user as any).profileComplete) {
      router.push("/");
    }
  }, [session, status, router]);

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (value.length > 30) {
      return "Username must be less than 30 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return "";
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase());
    setUsernameError(validateUsername(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName: displayName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to complete profile");
        if (data.error?.includes("username")) {
          setUsernameError(data.error);
        }
        return;
      }

      toast.success("Profile completed! Welcome to NeuroKid");
      await update();
      router.push("/");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Complete Your Profile
            </h1>
            <p className="text-[var(--text-secondary)]">
              Choose a unique username and display name to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  @
                </span>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="yourname"
                  className={`w-full pl-8 pr-4 py-3 bg-[var(--bg-primary)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all ${
                    usernameError ? "border-red-500" : "border-[var(--border-light)]"
                  }`}
                  maxLength={30}
                />
              </div>
              {usernameError && (
                <p className="mt-1 text-sm text-red-500">{usernameError}</p>
              )}
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Letters, numbers, and underscores only. This is how others will find you.
              </p>
            </div>

            <div>
              <label 
                htmlFor="displayName" 
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                maxLength={50}
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                This is how your name will appear to others.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !!usernameError || !username || !displayName.trim()}
              className="w-full py-3 px-4 bg-[var(--primary)] text-white font-semibold rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Completing..." : "Complete Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
