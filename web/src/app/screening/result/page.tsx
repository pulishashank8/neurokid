"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Summary = {
  score: number;
  category: "Low" | "Moderate" | "High";
  group: "toddler" | "child";
  rawScore?: number;
  maxScore?: number;
  interpretation?: string;
  // Legacy fields (may not be present in new summaries)
  totals?: { socialRaw: number; repSensRaw: number; regulationRaw: number; maxRaw: number };
  createdAt: string;
};

const categoryColor = (c: Summary["category"]) => {
  switch (c) {
    case "Low":
      return { bg: "bg-green-100", text: "text-green-700", stroke: "#16a34a" };
    case "Moderate":
      return { bg: "bg-orange-100", text: "text-orange-700", stroke: "#f97316" };
    case "High":
      return { bg: "bg-rose-100", text: "text-rose-700", stroke: "#e11d48" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700", stroke: "#9ca3af" };
  }
};

export default function ScreeningResultPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [saveEnabled, setSaveEnabled] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("nk-screening-summary");
    if (raw) {
      try {
        setSummary(JSON.parse(raw));
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (saveEnabled && summary) {
      try {
        const existing = JSON.parse(localStorage.getItem("nk-screening-summaries") || "[]");
        existing.push({
          score: summary.score,
          category: summary.category,
          group: summary.group,
          createdAt: summary.createdAt,
        });
        localStorage.setItem("nk-screening-summaries", JSON.stringify(existing));
      } catch { }
    }
  }, [saveEnabled, summary]);

  useEffect(() => {
    if (summary) console.log("Screening Summary:", summary);
  }, [summary]);

  const gauge = useMemo(() => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    // Normalize score to 0-100% for the gauge
    let rawPct = summary?.score ?? 0;
    if (summary?.group === "toddler") {
      // Toddler score is 0-20, scale to 100
      rawPct = (rawPct / 20) * 100;
    }

    const pct = Math.max(0, Math.min(100, rawPct));
    const dash = (pct / 100) * circumference;
    return { radius, circumference, dash };
  }, [summary]);

  if (!summary) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-[var(--muted)]">No results found. Please start the screening.</p>
        <Link href="/screening" className="mt-4 inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-[var(--primary-foreground)]">Go to Screening</Link>
      </div>
    );
  }

  const color = categoryColor(summary.category);

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[var(--text)]">Screening Results</h1>
          <p className="text-xs text-[var(--muted)]">Group: {summary.group === "toddler" ? "Toddler (18–36 months)" : "Child (3–12 years)"}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-12 items-start">
          {/* Left Column: Gauge & Score */}
          <div className="md:col-span-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex flex-col items-center">
              <svg width="160" height="160" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={gauge.radius} stroke="var(--border)" strokeWidth="16" fill="none" />
                <circle
                  cx="100" cy="100" r={gauge.radius} stroke={color.stroke} strokeWidth="16" fill="none"
                  strokeDasharray={`${gauge.dash} ${gauge.circumference}`} strokeLinecap="round" transform="rotate(-90 100 100)"
                />
                <text x="100" y="110" textAnchor="middle" fill="var(--text)" fontSize="28" fontWeight={700}>{summary.score}</text>
              </svg>

              <div className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm ${color.bg} ${color.text}`}>
                {summary.category} Probability
              </div>
              <p className="mt-2 text-center text-xs text-[var(--muted)]">
                Likelihood of Autism Spectrum Disorder
              </p>
              <p className="mt-1 text-[10px] text-[var(--muted)] opacity-75">
                {summary.group === "toddler"
                  ? `Raw Score: ${summary.rawScore || summary.score}/20`
                  : `Score: ${summary.score}/100`}
              </p>
            </div>
          </div>

          {/* Right Column: Understanding & Interpretation */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-md)]">
              <h3 className="text-sm font-bold text-[var(--text)] mb-3">Understanding the Results</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-[var(--text)]">High Probability</span>
                    <p className="text-[10px] text-[var(--muted)] leading-tight">High likelihood of autism. Professional evaluation strongly recommended.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-[var(--text)]">Moderate Probability</span>
                    <p className="text-[10px] text-[var(--muted)] leading-tight">Some traits consistent with autism. Professional consultation advised.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-[var(--text)]">Low Probability</span>
                    <p className="text-[10px] text-[var(--muted)] leading-tight">Few or no traits consistent with autism. Continue routine monitoring.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-md)] relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-[var(--primary)] opacity-10 blur-xl"></div>
              <h3 className="text-sm font-bold text-[var(--text)] mb-2">Interpretation</h3>
              <p className="text-xs text-[var(--text)] leading-relaxed relative z-10">
                {summary.interpretation || "Please consult with your healthcare provider."}
              </p>
            </div>
          </div>
        </div>

        {/* Next steps - Compact Row */}
        <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Link href={{ pathname: "/community/new", query: { title: "Screening results", body: `Score ${summary.group === "toddler" ? `${summary.rawScore || summary.score}/20` : `${summary.score}/100`} (${summary.category}).` } }} className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
            <div className="text-xl bg-[var(--surface2)] p-2 rounded-lg group-hover:scale-110 transition-transform">👥</div>
            <div>
              <div className="font-bold text-sm text-[var(--text)]">Community</div>
              <div className="text-[10px] text-[var(--muted)]">Ask other parents</div>
            </div>
          </Link>
          <Link href={{ pathname: "/providers", query: { ageGroup: summary.group } }} className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
            <div className="text-xl bg-[var(--surface2)] p-2 rounded-lg group-hover:scale-110 transition-transform">⚕️</div>
            <div>
              <div className="font-bold text-sm text-[var(--text)]">Providers</div>
              <div className="text-[10px] text-[var(--muted)]">Find specialists</div>
            </div>
          </Link>
          <Link href="/ai-support" className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
            <div className="text-xl bg-[var(--surface2)] p-2 rounded-lg group-hover:scale-110 transition-transform">🧠</div>
            <div>
              <div className="font-bold text-sm text-[var(--text)]">AI Support</div>
              <div className="text-[10px] text-[var(--muted)]">Get guidance</div>
            </div>
          </Link>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between text-[10px] text-[var(--muted)]">
          <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--text)] transition-colors">
            <input type="checkbox" checked={saveEnabled} onChange={(e) => setSaveEnabled(e.target.checked)} className="rounded border-[var(--border)]" />
            Save summary to my device
          </label>

          <div className="text-right">
            {summary.group === "toddler" && (
              <span className="block mb-1">Based on M-CHAT-R/F™ (© 2009 Robins, Fein, & Barton)</span>
            )}
            <span className="block">Not a medical diagnosis. Consult a professional.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
