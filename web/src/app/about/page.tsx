"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Shield, Brain, Heart, CheckCircle2, Quote, Sparkles, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] pt-24 pb-32">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-[var(--primary)] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-b from-transparent to-[var(--background)] opacity-50 z-0 pointer-events-none"></div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface2)] px-4 py-1.5 text-xs font-bold text-[var(--primary)] uppercase tracking-widest mb-8 border border-[var(--border)] shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Our Story
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-[var(--text)] sm:text-6xl lg:text-7xl mb-8 leading-tight">
            Redefining Support for <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-emerald-400">Neurodivergent Families</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-[var(--muted)] leading-relaxed">
            We are building the digital infrastructure of hope—connecting awareness with action, and isolation with community.
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 border-b border-[var(--border)] overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 md:grid-cols-2 items-center">
            {/* Founder Photo - Premium Presentation */}
            <div className="flex justify-center md:justify-end relative">
              <div className="relative group">
                {/* Decorative border frame */}
                <div className="absolute -inset-4 border border-[var(--border)] rounded-[2rem] z-0"></div>

                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                <div className="relative rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-transform duration-500 group-hover:-translate-y-1">
                  <Image
                    src="/founder-v2.jpg"
                    alt="Shashank Puli, Founder of NeuroKid"
                    width={450}
                    height={550}
                    className="w-full max-w-sm object-cover grayscale transition-all duration-700 hover:grayscale-0 hover:scale-105"
                    priority
                  />

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="font-bold text-lg">Shashank Puli</p>
                    <p className="text-xs text-white/80 uppercase tracking-widest">Founder & Visionary</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Story */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-[var(--text)] mb-6">The "Why" Behind NeuroKid</h2>
                <div className="w-20 h-1.5 bg-[var(--primary)] rounded-full mb-8"></div>

                <div className="prose prose-lg dark:prose-invert text-[var(--muted)] leading-relaxed space-y-6">
                  <p>
                    I'm not just building a business; I'm building a global infrastructure of hope. NeuroKid was born not as a startup, but as a <strong className="text-[var(--text)]">movement</strong>.
                  </p>
                  <p>
                    Every parent I spoke with shared the same story: confusion, guilt, and isolation. The real problem isn't autism itself — it's the absence of a system connecting awareness with action.
                  </p>
                  <p>
                    We strive to bridge compassion and technology to transform confusion into clarity, stigma into empowerment, and isolation into community.
                  </p>
                </div>
              </div>

              <blockquote className="relative p-8 rounded-2xl bg-[var(--surface2)] border border-[var(--border)]">
                <Quote className="absolute top-4 left-4 w-8 h-8 text-[var(--primary)] opacity-20" />
                <p className="text-xl font-medium italic text-[var(--text)] relative z-10 pl-4">
                  "Autism is not a disorder to be cured, but a difference to be understood."
                </p>
              </blockquote>

              <div>
                <a href="mailto:pulishashank8@gmail.com" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors uppercase tracking-wide group">
                  Connect Directly <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Glassmorphic Cards */}
      <section className="py-24 bg-[var(--surface)] border-b border-[var(--border)] relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Mission Card */}
            <div className="group rounded-3xl border border-[var(--border)] bg-[var(--background)] p-10 shadow-[var(--shadow-md)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-rose-500/10 transition-colors"></div>

              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-[var(--text)]">Our Mission</h3>
              <p className="text-lg text-[var(--muted)] leading-relaxed">
                To empower parents and caregivers with evidence-based information, professional access, peer support, and validated screening tools. We aim to replace confusion with clarity and fear with informed confidence.
              </p>
            </div>

            {/* Vision Card */}
            <div className="group rounded-3xl border border-[var(--border)] bg-[var(--background)] p-10 shadow-[var(--shadow-md)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-500/10 transition-colors"></div>

              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-[var(--text)]">Our Vision</h3>
              <p className="text-lg text-[var(--muted)] leading-relaxed">
                To be the most trusted and comprehensive resource platform for autism families worldwide. Building a future where neurodiversity is recognized as human diversity, and families feel pride and purpose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl mb-4">Our Core Pillars</h2>
            <p className="text-[var(--muted)] max-w-2xl mx-auto text-lg">The foundation of how we support your journey.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: <Users className="h-6 w-6" />,
                color: "bg-blue-500",
                title: "Community",
                desc: "A safe digital haven where parents connect anonymously. In NeuroKid, anonymity isn't hiding — it's healing."
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
              <div key={i} className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center transition-all hover:-translate-y-1 hover:shadow-xl hover:border-[var(--primary)]/30">
                <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} text-white shadow-lg shadow-${item.color}/20 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-[var(--text)]">{item.title}</h3>
                <p className="text-[var(--muted)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Purpose Disclaimer */}
      <section className="py-12 bg-[var(--surface2)] border-t border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-[10px] text-[var(--muted)] opacity-60 leading-relaxed max-w-3xl mx-auto uppercase tracking-wide">
            DISCLAIMER: NeuroKid is a personal project by Shashank Puli, created as an MVP for educational and demonstration purposes only.
            The content provided is not intended to replace professional medical advice, diagnosis, or treatment.
            Always seek the advice of a qualified health provider with any questions regarding a medical condition.
          </p>
          <p className="mt-2 text-[10px] text-[var(--muted)] opacity-40">
            © 2026 NeuroKid.
          </p>
        </div>
      </section>
    </div>
  );
}
