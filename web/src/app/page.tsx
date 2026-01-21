"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Users, Stethoscope, Brain, ClipboardCheck, ArrowRight, Sparkles, Heart } from "lucide-react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Show loading while checking auth or if authenticated (redirect happening)
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <p className="mt-4 text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-[var(--background)]">
      {/* Hero Section - Premium Design */}
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] pt-20 pb-24 sm:pt-24 sm:pb-32">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/3 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface2)] px-4 py-1.5 text-xs font-bold text-[var(--primary)] uppercase tracking-widest mb-8 border border-[var(--border)] shadow-sm animate-fade-in-up">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to NeuroKid
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-[var(--text)] sm:text-6xl lg:text-7xl mb-6">
            <span className="text-[var(--primary)]">NeuroKid</span>
            <span className="block text-3xl sm:text-5xl mt-2 font-bold text-[var(--muted)]">Empowering Families. Connecting Hearts.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl text-[var(--muted)] leading-relaxed px-4">
            A compassionate digital ecosystem connecting you with community, verified providers, AI support, and resources.
            Transform confusion into clarity.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--primary)] text-white font-bold text-lg shadow-lg shadow-[var(--primary)]/30 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                Start Screening <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] font-bold text-lg hover:bg-[var(--surface2)] hover:-translate-y-1 transition-all">
                Join Now
              </button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-[var(--muted)] opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"><Users className="w-4 h-4" /> Community First</span>
            <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"><Heart className="w-4 h-4" /> Parents Trusted</span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Section */}
      <div className="py-24 sm:py-32 bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl px-4 mb-4">Everything you need in one place</h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto px-4">Comprehensive support tools designed specifically for neurodivergent families.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pillar 1: Community */}
            <div className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-2">Community</h3>
              <p className="text-sm font-medium text-[var(--primary)] mb-3">Share & Connect</p>
              <p className="text-[var(--muted)] leading-relaxed text-sm mb-6">
                A safe, anonymous space to ask questions, share stories, and find strength in shared experiences.
              </p>
              <Link href="/community" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface2)] text-sm font-semibold text-[var(--text)] group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                Explore <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pillar 2: Healthcare Providers */}
            <div className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-6 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-2">Providers</h3>
              <p className="text-sm font-medium text-rose-500 mb-3">Verify & Locate</p>
              <p className="text-[var(--muted)] leading-relaxed text-sm mb-6">
                Find trusted ABA, OT, and Speech specialists nearby with verified credentials and parent reviews.
              </p>
              <Link href="/providers" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface2)] text-sm font-semibold text-[var(--text)] group-hover:bg-rose-500 group-hover:text-white transition-colors">
                Find Care <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pillar 3: AI Support */}
            <div className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-2">AI Support</h3>
              <p className="text-sm font-medium text-purple-500 mb-3">24/7 Guidance</p>
              <p className="text-[var(--muted)] leading-relaxed text-sm mb-6">
                Instant, compassionate answers to your questions about behavior, IEPs, and daily routines.
              </p>
              <Link href="/ai-support" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface2)] text-sm font-semibold text-[var(--text)] group-hover:bg-purple-500 group-hover:text-white transition-colors">
                Chat Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pillar 4: Autism Screening */}
            <div className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 mb-6 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-2">Screening</h3>
              <p className="text-sm font-medium text-green-500 mb-3">M-CHAT-R/F™ Tools</p>
              <p className="text-[var(--muted)] leading-relaxed text-sm mb-6">
                Validated screening tools to help you understand developmental milestones and next steps.
              </p>
              <Link href="/screening" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface2)] text-sm font-semibold text-[var(--text)] group-hover:bg-green-500 group-hover:text-white transition-colors">
                Start Screen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-emerald-700 opacity-95"></div>
        {/* Pattern */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>

        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl px-4 mb-6">
            Your Journey, Supported.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg sm:text-xl text-emerald-50 px-4 mb-10 leading-relaxed">
            Join thousands of parents and professionals building a world where neurodiversity is celebrated.
          </p>
          <Link href="/register" className="inline-block px-4">
            <button className="px-8 py-4 rounded-xl bg-white text-[var(--primary)] font-bold text-lg shadow-xl hover:bg-emerald-50 hover:-translate-y-1 transition-all">
              Create Free Account
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)] py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[var(--primary)]">NeuroKid</span>
              <span className="text-sm text-[var(--muted)] pl-4 border-l border-[var(--border)]">© 2026</span>
            </div>

            <div className="flex gap-8">
              <Link href="/about" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                About Us
              </Link>
              <Link href="/resources" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                Resources
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                Privacy
              </Link>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-8 text-center">
            <p className="text-[10px] text-[var(--muted)] opacity-60 leading-relaxed max-w-3xl mx-auto uppercase tracking-wide">
              DISCLAIMER: NeuroKid is a personal project by Shashank Puli, created as an MVP for educational and demonstration purposes only.
              The content provided is not intended to replace professional medical advice, diagnosis, or treatment.
              Always seek the advice of a qualified health provider with any questions regarding a medical condition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
