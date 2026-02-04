"use client";

import Link from "next/link";
import {
  ClipboardList,
  TrendingUp,
  Users,
  Shield,
  Calendar,
  Smile,
  Target,
  ArrowRight,
  Check,
  BarChart3
} from "lucide-react";

export function TherapyLogLandingContent() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-[var(--background)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6">
                <ClipboardList className="w-4 h-4" />
                Free Therapy Tracker
              </div>

              {/* H1 */}
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                Autism Therapy Log &<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Progress Tracker
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Track ABA, speech, occupational, and behavioral therapy sessions all in one place.
                Monitor progress, spot patterns, and share insights with your child's care team.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/register">
                  <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-95 transition-all hover:-translate-y-1 flex items-center gap-2">
                    Start Tracking Free <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  No credit card required
                </p>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-500">This Month</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">12 Sessions</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { type: "ABA Therapy", count: 5, color: "bg-blue-500" },
                    { type: "Speech Therapy", count: 4, color: "bg-emerald-500" },
                    { type: "Occupational Therapy", count: 3, color: "bg-purple-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{item.type}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-500">Progress This Month</span>
                    <span className="text-emerald-500 font-bold">+23%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Therapy Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Supported Therapy Types">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Track Every Type of Therapy
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              One place for all your child's therapeutic interventions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "ABA Therapy", color: "bg-blue-500", icon: "🧩" },
              { name: "Speech Therapy", color: "bg-emerald-500", icon: "🗣️" },
              { name: "Occupational Therapy", color: "bg-purple-500", icon: "✋" },
              { name: "Behavioral Therapy", color: "bg-amber-500", icon: "🎯" },
              { name: "Play Therapy", color: "bg-pink-500", icon: "🎨" },
              { name: "Social Skills", color: "bg-teal-500", icon: "👥" },
              { name: "Physical Therapy", color: "bg-orange-500", icon: "🏃" },
              { name: "Other", color: "bg-slate-500", icon: "📋" },
            ].map((therapy, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center hover:border-blue-500/50 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${therapy.color} flex items-center justify-center text-2xl mx-auto mb-3`}>
                  {therapy.icon}
                </div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{therapy.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="Tracking Features">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Everything You Need to Track Progress
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: <Calendar className="w-5 h-5" />,
                    title: "Session Details",
                    description: "Log date, duration, therapist, and therapy type for every session.",
                  },
                  {
                    icon: <Smile className="w-5 h-5" />,
                    title: "Mood Tracking",
                    description: "Record how your child felt during and after each session.",
                  },
                  {
                    icon: <Target className="w-5 h-5" />,
                    title: "Goals & Progress",
                    description: "Note what went well and areas to work on for next time.",
                  },
                  {
                    icon: <TrendingUp className="w-5 h-5" />,
                    title: "Visual Reports",
                    description: "See progress over time with charts and trend analysis.",
                  },
                  {
                    icon: <Users className="w-5 h-5" />,
                    title: "Share with Team",
                    description: "Generate reports to share with therapists and doctors.",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    title: "Private & Secure",
                    description: "Your data is encrypted and never shared with third parties.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-xl">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Recent Sessions</h3>
              <div className="space-y-4">
                {[
                  {
                    type: "ABA Therapy",
                    date: "Today",
                    duration: "60 min",
                    mood: "😊",
                    highlight: "Great progress with communication tokens"
                  },
                  {
                    type: "Speech Therapy",
                    date: "Yesterday",
                    duration: "45 min",
                    mood: "🙂",
                    highlight: "Practiced 5 new words"
                  },
                  {
                    type: "Occupational Therapy",
                    date: "Jan 28",
                    duration: "60 min",
                    mood: "😐",
                    highlight: "Worked on fine motor skills"
                  },
                ].map((session, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{session.type}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-500">{session.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>{session.duration}</span>
                      <span>{session.mood}</span>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">{session.highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Benefits of Tracking">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-12">
            Why Parents Love Our Therapy Tracker
          </h2>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                stat: "87%",
                label: "of parents report better communication with therapists",
              },
              {
                stat: "10k+",
                label: "therapy sessions logged every month",
              },
              {
                stat: "4.9/5",
                label: "average rating from parents",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">{item.stat}</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="FAQ">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How do I track my child's autism therapy progress?",
                a: "Simply log each therapy session in Neuro Kid, noting the type, duration, and outcomes. Over time, you'll build a comprehensive picture of your child's progress that you can share with their care team.",
              },
              {
                q: "Can I track multiple children?",
                a: "Yes! You can create separate therapy logs for each child, keeping their progress organized and easily accessible.",
              },
              {
                q: "Is the therapy tracker really free?",
                a: "Absolutely. Our therapy tracking features are completely free with no limits on the number of sessions you can log.",
              },
              {
                q: "Can therapists access the logs directly?",
                a: "You control access. Generate shareable reports or print summaries to bring to appointments—your data stays private unless you choose to share it.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 pl-8">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Get Started">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Start Tracking Your Child's Progress Today
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Join thousands of parents who use Neuro Kid to stay organized and
            advocate effectively for their children's therapy needs.
          </p>
          <Link href="/register">
            <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg shadow-xl shadow-blue-500/30 active:scale-95 transition-all hover:-translate-y-1">
              Create Free Account →
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div className="pb-8 text-center">
        <Link href="/" className="text-slate-500 hover:text-blue-500 transition-colors">
          ← Back to Neuro Kid Home
        </Link>
      </div>
    </div>
  );
}
