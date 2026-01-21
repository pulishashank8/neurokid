"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section - Clean, calm design */}
      <div className="relative bg-[var(--background)] border-b border-[var(--border)] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="text-[var(--primary)]">NeuroKind</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl font-semibold text-[var(--text)] sm:text-2xl md:text-3xl">
              Empowering Autism Awareness, One Family at a Time
            </p>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base text-[var(--muted)] sm:text-lg md:text-xl px-4">
              A compassionate digital ecosystem connecting families with community, verified providers,
              AI support, and resources. Transform confusion into clarity. Replace isolation with inclusion.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4 px-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto min-h-[48px]">Sign In</Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto min-h-[48px]">
                  Join Now
                </Button>
              </Link>
            </div>
            <div className="mt-6">
              <Link href="/about" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium underline transition-colors">
                Learn more about NeuroKind →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Section */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl md:text-4xl px-4">Everything you need in one place</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[var(--muted)] px-4">Four pillars of support for autistic families</p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pillar 1: Community */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary)] bg-opacity-10">
                <svg
                  className="h-6 w-6 text-[var(--primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
                Community
              </h3>
              <p className="mt-2 text-sm font-medium text-[var(--text)]">
                Ask questions. Share experiences. Feel supported.
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                A Reddit-style community where parents can post questions, and anyone can join the conversation with helpful replies.
              </p>
              <Link href="/community" className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                Explore →
              </Link>
            </div>

            {/* Pillar 2: Healthcare Providers */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--success)] bg-opacity-10">
                <svg
                  className="h-6 w-6 text-[var(--success)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
                Healthcare Providers
              </h3>
              <p className="mt-2 text-sm font-medium text-[var(--text)]">
                Find ABA, OT, Speech, and autism specialists nearby.
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Search trusted providers with ratings, reviews, and contact info.
              </p>
              <Link href="/providers" className="mt-4 inline-block text-sm font-medium text-[var(--success)] hover:opacity-80 transition-opacity">
                Explore →
              </Link>
            </div>

            {/* Pillar 3: AI Support */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--info)] bg-opacity-10">
                <svg
                  className="h-6 w-6 text-[var(--info)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
                AI Support
              </h3>
              <p className="mt-2 text-sm font-medium text-[var(--text)]">
                Autism-focused guidance, anytime.
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                A safe AI assistant to help parents understand behaviors, routines, therapy options, and school support.
              </p>
              <Link href="/ai-support" className="mt-4 inline-block text-sm font-medium text-[var(--info)] hover:opacity-80 transition-opacity">
                Explore →
              </Link>
            </div>

            {/* Pillar 4: Autism Screening */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--warning)] bg-opacity-10">
                <svg
                  className="h-6 w-6 text-[var(--warning)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
                Autism Screening
              </h3>
              <p className="mt-2 text-sm font-medium text-[var(--text)]">
                A quick parent-friendly screening flow.
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Answer simple questions and get a clear score-style result with next-step guidance. Not a diagnosis.
              </p>
              <Link href="/screening" className="mt-4 inline-block text-sm font-medium text-[var(--warning)] hover:opacity-80 transition-opacity">
                Explore →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-[var(--primary)] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl px-4">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-white opacity-90 px-4">
            Join our community today and connect with others on the neurodivergent spectrum.
          </p>
          <Link href="/register" className="mt-6 sm:mt-8 inline-block px-4">
            <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-opacity-90 min-h-[48px] w-full sm:w-auto">
              Create Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)] py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 sm:flex-row">
            <p className="text-sm text-[var(--muted)]">
              © 2026 NeuroKind. A safe space for neurodivergent communities.
            </p>
            <div className="flex gap-6">
              <Link href="/resources" className="text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                Resources
              </Link>
              <Link href="/settings" className="text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                Settings
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-4 text-center">
            <p className="text-[10px] text-[var(--muted)] opacity-60 leading-relaxed max-w-3xl mx-auto uppercase tracking-wide">
              DISCLAIMER: NeuroKind is a personal project by Shashank Puli, created as an MVP for educational and demonstration purposes only.
              The content provided is not intended to replace professional medical advice, diagnosis, or treatment.
              Always seek the advice of a qualified health provider with any questions regarding a medical condition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
