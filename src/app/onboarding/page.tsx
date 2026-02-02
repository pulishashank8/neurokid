"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, User, AtSign, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName || !formData.username) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Welcome to NeuroKid!");
        // Update session to reflect completed profile
        await update();
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to complete onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 shadow-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
              Welcome to the family
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Just a few more details to get you started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  What should we call you?
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Alex Johnson)"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Choose a unique username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 ml-1">
                  Username can only contain lowercase letters, numbers, underscores, and hyphens.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:opacity-90 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                By completing your profile, you'll be able to join discussions, message other parents, and use our AI assistant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
