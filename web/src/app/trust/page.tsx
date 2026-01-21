"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, CheckCircle2, AlertTriangle, Users } from "lucide-react";

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)] py-12 sm:py-20 relative overflow-hidden">
        {/* Background blobs for premium feel */}
        <div className="absolute top-0 right-0 -tr-24 w-64 h-64 bg-[var(--primary)] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -bl-24 w-64 h-64 bg-teal-500 opacity-5 rounded-full blur-3xl"></div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface2)] px-4 py-1.5 mb-6 text-sm font-medium text-[var(--text)]">
            <Shield className="w-4 h-4 text-[var(--primary)]" />
            <span>Privacy First Protocol</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] mb-6">
            Trust & <span className="text-[var(--primary)]">Safety</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-[var(--muted)] leading-relaxed">
            Your family's privacy isn't just a policy—it's our core promise. We built NeuroKid to be a safe haven for parents.
          </p>
        </div>
      </section>

      {/* Core Promises */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Lock className="w-6 h-6 text-[var(--primary)]" />,
                title: "Anonymous by Design",
                desc: "Share your journey without sharing your identity. No real names required in community spaces."
              },
              {
                icon: <Eye className="w-6 h-6 text-[var(--primary)]" />,
                title: "Zero Data Sales",
                desc: "We never sell your personal data to advertisers or third parties. Your health data stays yours."
              },
              {
                icon: <Shield className="w-6 h-6 text-[var(--primary)]" />,
                title: "End-to-End Safety",
                desc: "Enterprise-grade encryption protects your private conversations and screening results."
              }
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
                <div className="mb-4 inline-block rounded-xl bg-[var(--surface2)] p-3">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-3">{item.title}</h3>
                <p className="text-[var(--muted)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Details Grid */}
      <section className="py-12 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-12 text-center">How We Protect You</h2>

          <div className="space-y-8">
            {/* Anonymity */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
              <div className="flex-shrink-0 rounded-full bg-green-100 p-3 text-green-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-2">Community Anonymity</h3>
                <p className="text-[var(--muted)] mb-4 leading-relaxed">
                  We understand the fear of judgment. In NeuroKid, you can be open about challenges without exposing your family's identity to the public web.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Optional profiles
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Private message encryption
                  </li>
                </ul>
              </div>
            </div>

            <div className="h-px bg-[var(--border)] w-full" />

            {/* Data Control */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
              <div className="flex-shrink-0 rounded-full bg-blue-100 p-3 text-blue-600">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-2">Total Data Control</h3>
                <p className="text-[var(--muted)] mb-4 leading-relaxed">
                  You own your data, not us. You can export it, delete it, or hide it at any time with a single click in your settings.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> One-click account deletion
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> Full data export available
                  </li>
                </ul>
              </div>
            </div>

            <div className="h-px bg-[var(--border)] w-full" />

            {/* AI Safety */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
              <div className="flex-shrink-0 rounded-full bg-amber-100 p-3 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-2">Responsible AI</h3>
                <p className="text-[var(--muted)] mb-4 leading-relaxed">
                  Our AI is trained to be supportive, not diagnostic. It has strict guardrails to prevent harmful advice and always recommends professional care for medical decisions.
                </p>
                <div className="rounded-lg bg-[var(--warning-bg)] border border-[var(--warning-border)] p-4 text-sm text-[var(--text)]">
                  <strong>Note:</strong> While helpful, our AI tools are educational resources, not a replacement for doctors or therapists.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 sm:py-24 px-4 text-center">
        <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Have specific concerns?</h2>
        <p className="text-[var(--muted)] mb-8">
          We handle privacy inquiries personally. Reach out to our team.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Force text color with !important to override global anchor styles */}
          <a href="mailto:pulishashank8@gmail.com" className="rounded-xl bg-[var(--primary)] px-8 py-3 font-bold !text-white dark:!text-gray-900 hover:bg-[var(--primary-hover)] transition-colors shadow-lg">
            Contact Privacy Team
          </a>
          <Link href="/" className="px-6 py-3 font-medium !text-[var(--text)] hover:!text-[var(--primary)] transition-colors">
            Return Home
          </Link>
        </div>
      </section>
    </div>
  );
}
