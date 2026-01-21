"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ScreeningDisclaimer from "./disclaimer";

export default function ScreeningIntroPage() {
  const router = useRouter();
  const { status } = useSession();
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [prevEval, setPrevEval] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    setError("");
    const n = parseFloat(age);
    if (isNaN(n)) {
      setError("Please enter your child's age (e.g., 2.5)");
      return;
    }
    let group: "toddler" | "child" | null = null;
    if (n >= 1.5 && n < 3.0) group = "toddler";
    else if (n >= 3.0 && n <= 12.0) group = "child";

    if (!group) {
      setError(
        "This screening currently supports ages 1.5–12.0 years. Please visit Providers or Community for support."
      );
      return;
    }

    const intake = { age: n, gender: gender || null, prevEval: prevEval || null, group };
    try {
      sessionStorage.setItem("nk-screening-intake", JSON.stringify(intake));
    } catch { }
    router.push(`/screening/${group}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <section className="border-b border-[var(--border)] bg-[var(--surface)] py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text)]">Autism Screening</h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--muted)] max-w-2xl mx-auto">
            This is a parent-friendly screening tool, not a diagnosis. It helps you
            understand whether a professional evaluation may be helpful.
          </p>
          <p className="mt-2 text-xs sm:text-sm text-[var(--muted)] max-w-2xl mx-auto">
            For toddlers (1.5-3 years), we use the validated <strong>M-CHAT-R/F</strong> screening tool.
            For older children (3-12 years), we use a general developmental screening.
          </p>
        </div>
      </section>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 shadow-[var(--shadow-md)]">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Child age (years)</label>
                <input
                  type="number"
                  step="0.1"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text)] px-3 py-2 min-h-[44px] placeholder:text-[var(--muted)]"
                />
                <p className="mt-2 text-xs text-[var(--muted)]">Supported ages: 1.5–12.0 years</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Child gender (optional)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text)] px-3 py-2 min-h-[44px]"
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="nonbinary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Has your child had a professional evaluation before? (optional)
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
                    { v: "yes", label: "Yes" },
                    { v: "no", label: "No" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setPrevEval(o.v)}
                      className={`flex-1 sm:flex-none rounded-lg border border-[var(--border)] px-4 py-2 text-sm min-h-[44px] transition-colors ${prevEval === o.v ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface2)]"
                        }`}
                    >
                      {o.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setPrevEval("")}
                    className="flex-1 sm:flex-none rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface2)] px-4 py-2 text-sm min-h-[44px] transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-[var(--error)] bg-[var(--error-bg)] p-3 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-[var(--muted)]">
                Disclaimer: This screening does not diagnose autism. It only indicates whether a professional evaluation may be helpful.
              </p>
              <button
                onClick={handleStart}
                className="w-full sm:w-auto rounded-lg bg-[var(--primary)] px-6 py-2 text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)] min-h-[48px] font-medium transition-colors"
              >
                Start Screening
              </button>
            </div>
          </div>

          <div className="mt-8">
            <ScreeningDisclaimer />
          </div>
        </div>
      </section>
    </div>
  );
}
