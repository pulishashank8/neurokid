"use client";

import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="border-b border-blue-100 bg-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            About <span className="text-blue-600">NeuroKind</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
            Empowering Autism Awareness, One Family at a Time
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 items-center">
            {/* Founder Photo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-green-400 rounded-2xl blur-2xl opacity-20"></div>
                <div className="relative rounded-2xl border border-blue-200 bg-white p-1 overflow-hidden">
                  <Image
                    src="/founder-v2.jpg"
                    alt="Shashank Puli, Founder of NeuroKind"
                    width={360}
                    height={430}
                    className="w-full h-auto rounded-xl object-cover"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Founder Story */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Shashank Puli</h2>
              <p className="text-sm font-medium text-blue-600 mb-4">Founder & Visionary</p>
              <blockquote className="mb-6 pl-4 border-l-4 border-blue-600">
                <p className="text-lg font-medium italic text-gray-700">
                  "Autism is not a disorder to be cured, but a difference to be understood."
                </p>
              </blockquote>
              <p className="mb-4 text-gray-600 leading-relaxed">
                I'm not just building a business; I'm building a global infrastructure of hope — a system where families don't have to search for help, because help finds them.
              </p>
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/80 p-4 shadow-sm">
                <p className="text-sm font-semibold text-blue-900">Reach Shashank directly</p>
                <a
                  className="mt-2 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  href="mailto:pulishashank8@gmail.com"
                >
                  pulishashank8@gmail.com
                </a>
                <p className="mt-2 text-xs text-blue-800/80">Partnerships, product feedback, or provider collaboration are always welcome.</p>
              </div>
              <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p>
                  NeuroKind was born not as a startup, but as a <strong>movement</strong>. Every parent I spoke with shared the same story: confusion, guilt, and isolation.
                </p>
                <p>
                  The real problem isn't autism itself — it's the absence of a system connecting awareness with action. Parents navigate an endless maze of therapists, special educators, insurance claims, and unverified online information. Families collapse under financial strain while children with extraordinary potential are labeled "difficult."
                </p>
                <p>
                  NeuroKind bridges compassion and technology to transform confusion into clarity, stigma into empowerment, and isolation into community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white border-y border-blue-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Our Mission & Vision</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {/* Mission Card */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8">
              <h3 className="mb-4 text-xl font-bold text-blue-900">Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                To make autism guidance, therapy, and community support accessible, affordable, and stigma-free for every family regardless of geography, culture, or income. We strive to replace confusion with clarity, isolation with inclusion, and fear with informed confidence.
              </p>
            </div>

            {/* Vision Card */}
            <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-8">
              <h3 className="mb-4 text-xl font-bold text-green-900">Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                To build a world where neurodiversity is recognized as human diversity — where parents no longer feel guilt or fear when raising an autistic child, but instead feel understanding, pride, and purpose. An inclusive future where empathy and technology coexist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Our Three Pillars</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Community */}
            <div className="group rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Community</h3>
              <p className="text-sm text-gray-700">
                A safe digital haven where parents, caregivers, and autistic adults connect anonymously. In NeuroKind's community, anonymity isn't hiding — it's healing.
              </p>
            </div>

            {/* Providers */}
            <div className="group rounded-2xl border border-coral-200 bg-gradient-to-br from-rose-50 to-rose-100/50 p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600">
                  <span className="text-2xl">⚕️</span>
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Find Providers</h3>
              <p className="text-sm text-gray-700">
                Connect with verified healthcare professionals, therapists, and specialists. Access vetted resources tailored to your family's needs.
              </p>
            </div>

            {/* AI Support */}
            <div className="group rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600">
                  <span className="text-2xl">🧠</span>
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Autism AI Support</h3>
              <p className="text-sm text-gray-700">
                Personalized guidance powered by AI. Get answers to common questions, access educational resources, and understand your options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white border-y border-blue-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Trust & Safety First</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Privacy */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-3 text-2xl">🔒</div>
              <h3 className="mb-2 font-bold text-gray-900">Privacy-First Design</h3>
              <p className="text-sm text-gray-600">
                End-to-end encryption and role-based access control protect every conversation and every family's data.
              </p>
            </div>

            {/* Data Minimization */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-3 text-2xl">📋</div>
              <h3 className="mb-2 font-bold text-gray-900">Data Minimization</h3>
              <p className="text-sm text-gray-600">
                We collect only what's necessary. Your personal identifiers stay hidden — even in community posts.
              </p>
            </div>

            {/* Transparency */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-3 text-2xl">👁️</div>
              <h3 className="mb-2 font-bold text-gray-900">Complete Transparency</h3>
              <p className="text-sm text-gray-600">
                Audit logs and data transparency screens show exactly who accessed your information and why.
              </p>
            </div>

            {/* Multi-Factor Auth */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-3 text-2xl">🔐</div>
              <h3 className="mb-2 font-bold text-gray-900">Multi-Factor Auth</h3>
              <p className="text-sm text-gray-600">
                Additional security layers protect your account and ensure only you can access your data.
              </p>
            </div>

            {/* AI Safety */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-3 text-2xl">⚠️</div>
              <h3 className="mb-2 font-bold text-gray-900">AI Safety</h3>
              <p className="text-sm text-gray-600">
                Our AI provides support, not medical advice. Always consult healthcare professionals for medical decisions.
              </p>
            </div>

            {/* Community Values */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-3 text-2xl">💚</div>
              <h3 className="mb-2 font-bold text-gray-900">Community Care</h3>
              <p className="text-sm text-gray-600">
                Moderation and kindness principles ensure a safe, supportive environment for everyone.
              </p>
            </div>
          </div>

          {/* Learn More Link */}
          <div className="mt-8 text-center">
            <Link
              href="/trust"
              className="inline-block text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Learn more about our Trust & Safety commitment →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Ready to Join the Movement?</h2>
          <p className="mb-8 text-lg text-blue-100">
            Connect with a supportive community of parents, caregivers, and neurodivergent individuals.
          </p>
          <Link
            href="/community"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 transition-all hover:shadow-lg hover:scale-105"
          >
            Join the Community
          </Link>
        </div>
      </section>
    </div>
  );
}
