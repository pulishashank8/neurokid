"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Shield, Brain, Heart, CheckCircle2, Quote } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)] py-12 sm:py-20 lg:py-24 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-[var(--primary)] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-blue-500 opacity-5 rounded-full blur-3xl"></div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl mb-6">
            About <span className="text-[var(--primary)]">NeuroKind</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-[var(--muted)] leading-relaxed">
            Empowering Autism Awareness, One Family at a Time.
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 sm:py-24 border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            {/* Founder Photo - Adjusted container for better fit */}
            <div className="flex justify-center md:justify-end">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-blue-500 rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                  {/* Using standard img tag if Image component has issues, or assume path works */}
                  <Image
                    src="/founder-v2.jpg"
                    alt="Shashank Puli, Founder of NeuroKind"
                    width={400}
                    height={480}
                    className="w-full max-w-xs md:max-w-sm rounded-xl object-cover grayscale-0 transition-all duration-500 hover:scale-[1.01]"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Founder Story */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface2)] px-3 py-1 text-xs font-semibold text-[var(--primary)] mb-4">
                <Users className="w-3 h-3" /> Founder & Visionary
              </div>
              <h2 className="text-3xl font-bold text-[var(--text)] mb-2">Shashank Puli</h2>

              <blockquote className="my-6 pl-4 border-l-4 border-[var(--primary)] py-1">
                <p className="text-lg font-medium italic text-[var(--text)] opacity-90">
                  "Autism is not a disorder to be cured, but a difference to be understood."
                </p>
              </blockquote>

              <div className="space-y-4 text-[var(--muted)] leading-relaxed">
                <p>
                  I'm not just building a business; I'm building a global infrastructure of hope — a system where families don't have to search for help, because help finds them.
                </p>
                <p>
                  NeuroKind was born not as a startup, but as a <strong>movement</strong>. Every parent I spoke with shared the same story: confusion, guilt, and isolation. The real problem isn't autism itself — it's the absence of a system connecting awareness with action.
                </p>
                <p>
                  We strive to bridge compassion and technology to transform confusion into clarity, stigma into empowerment, and isolation into community.
                </p>
              </div>

              <div className="mt-8">
                <div className="inline-block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-xs font-bold text-[var(--text)] mb-2">Connect Directly</p>
                  <a href="mailto:pulishashank8@gmail.com" className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline">
                    pulishashank8@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-24 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Mission Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-[var(--text)]">Our Mission</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                To empower parents and caregivers with evidence-based information, professional access, peer support, and validated screening tools. We aim to replace confusion with clarity and fear with informed confidence.
              </p>
            </div>

            {/* Vision Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <Quote className="w-6 h-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-[var(--text)]">Our Vision</h3>
              <p className="text-[var(--muted)] leading-relaxed">
                To be the most trusted and comprehensive resource platform for autism families worldwide. Building a future where neurodiversity is recognized as human diversity, and families feel pride and purpose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-[var(--text)] text-center mb-12">Our Core Pillars</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Users className="h-6 w-6" />,
                color: "bg-blue-500",
                title: "Community",
                desc: "A safe digital haven where parents connect anonymously. In NeuroKind, anonymity isn't hiding — it's healing."
              },
              {
                icon: <Shield className="h-6 w-6" />,
                color: "bg-rose-500",
                title: "Trusted Providers",
                desc: "Connect with verified professionals and access vetted resources tailored specifically to your family's needs."
              },
              {
                icon: <Brain className="h-6 w-6" />,
                color: "bg-purple-500",
                title: "AI Support",
                desc: "24/7 personalized guidance powered by AI to answer questions and help navigate the complex journey of specialized care."
              }
            ].map((item, i) => (
              <div key={i} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${item.color} text-white shadow-lg shadow-${item.color}/30`}>
                  {item.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-[var(--text)]">{item.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Purpose Disclaimer */}
      <section className="py-8 bg-[var(--surface2)] border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            <strong>DISCLAIMER:</strong> This is a personal project created for educational and demonstration purposes only.
            The information provided on this platform is not intended to replace professional medical advice, diagnosis, or treatment.
            Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </div>
      </section>
    </div>
  );
}
