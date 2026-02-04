"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  Image,
  Sun,
  Moon,
  Check,
  ArrowRight,
  Sparkles,
  Shield
} from "lucide-react";

export function DailyWinsLandingContent() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-[var(--background)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-6">
                <Calendar className="w-4 h-4" />
                Free Visual Schedule App
              </div>

              {/* H1 */}
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                Visual Schedules That<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
                  Bring Calm to Daily Life
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Reduce anxiety and transitions with customizable <strong>visual schedules</strong>.
                Create daily routines that help your autistic child feel secure,
                in control, and prepared for what comes next.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/register">
                  <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-lg shadow-lg shadow-amber-500/30 active:scale-95 transition-all hover:-translate-y-1 flex items-center gap-2">
                    Create Free Schedule <ArrowRight className="w-5 h-5" />
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
                    <p className="text-sm text-slate-500 dark:text-slate-500">Today's Schedule</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">Monday Routine</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { time: "7:00 AM", activity: "Wake Up", done: true, icon: "☀️" },
                    { time: "7:30 AM", activity: "Breakfast", done: true, icon: "🥣" },
                    { time: "8:00 AM", activity: "Brush Teeth", done: false, icon: "🪥", current: true },
                    { time: "8:15 AM", activity: "Get Dressed", done: false, icon: "👕" },
                    { time: "8:30 AM", activity: "School Bus", done: false, icon: "🚌" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 p-3 rounded-xl ${item.current ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30' : 'bg-slate-50 dark:bg-white/5'}`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${item.current ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.activity}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">{item.time}</p>
                      </div>
                      {item.done && <Check className="w-5 h-5 text-emerald-500" />}
                      {item.current && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Visual Schedules */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Benefits of Visual Schedules">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Why Visual Schedules Work for Autism
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Visual schedules reduce anxiety by making the abstract concept of "time" concrete and predictable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Predictable Routines",
                description: "Children know what to expect, reducing anxiety about the unknown and unexpected changes.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: <ArrowRight className="w-6 h-6" />,
                title: "Easier Transitions",
                description: "Moving from one activity to another becomes smoother when children can see what's coming next.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: <Check className="w-6 h-6" />,
                title: "Sense of Control",
                description: "Checking off completed tasks gives children a sense of accomplishment and control over their day.",
                color: "from-purple-500 to-violet-500",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-amber-500/50 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="Schedule Features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Create Schedules in Minutes
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to build effective visual routines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Image className="w-6 h-6" />,
                title: "Custom Photos",
                description: "Use our symbol library or upload your own photos of family, toys, and familiar places.",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Visual Timers",
                description: "Built-in timers help children understand how long each activity lasts.",
              },
              {
                icon: <Sun className="w-6 h-6" />,
                title: "Multiple Schedules",
                description: "Create different routines for weekdays, weekends, school days, and vacations.",
              },
              {
                icon: <Moon className="w-6 h-6" />,
                title: "Evening Routines",
                description: "Special templates for bedtime routines to help wind down for sleep.",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Drag & Drop Builder",
                description: "Intuitive interface makes creating and reordering schedules effortless.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Check-off Mode",
                description: "Children can mark tasks complete, building independence and confidence.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Examples */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Schedule Examples">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              From Morning to Bedtime
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Templates for every part of your child's day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Morning Routine",
                time: "7:00 - 8:30 AM",
                activities: ["Wake up", "Bathroom", "Breakfast", "Brush teeth", "Get dressed", "School"],
                icon: "☀️",
              },
              {
                title: "After School",
                time: "3:00 - 6:00 PM",
                activities: ["Snack", "Homework", "Free play", "Therapy", "Dinner prep"],
                icon: "🎒",
              },
              {
                title: "Evening Routine",
                time: "6:00 - 8:00 PM",
                activities: ["Dinner", "Bath", "Pajamas", "Story time", "Bed"],
                icon: "🌙",
              },
            ].map((schedule, index) => (
              <div key={index} className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{schedule.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{schedule.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500">{schedule.time}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {schedule.activities.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400">
                        {i + 1}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="Testimonial">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl p-8 sm:p-12 border border-amber-500/20">
            <blockquote className="text-center">
              <p className="text-xl sm:text-2xl text-slate-800 dark:text-slate-200 font-serif italic mb-6 leading-relaxed">
                "Mornings used to be a battle every single day. Since we started using Neuro Kid's
                visual schedule, my daughter knows exactly what to expect. The meltdowns have
                decreased by 90%. It's been life-changing for our whole family."
              </p>
              <footer className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
                  A
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white">Amanda T.</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Mom to a 5-year-old with autism</p>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="FAQ">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Why do visual schedules help autistic children?",
                a: "Visual schedules reduce anxiety by making time concrete and predictable. They help children understand what comes next, ease transitions, and provide a sense of security.",
              },
              {
                q: "At what age should I start using visual schedules?",
                a: "Visual schedules can be introduced at any age, even before diagnosis. Many parents start with toddlers using simple picture routines.",
              },
              {
                q: "Can I print the schedules?",
                a: "Yes! You can print schedules to post on the wall, take to school, or use when devices aren't available.",
              },
              {
                q: "What if my child resists following the schedule?",
                a: "Start small with just 2-3 activities. Involve your child in choosing the pictures. Consistency and positive reinforcement help build the habit.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
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
            Bring Calm to Your Child's Day
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Join thousands of families using Neuro Kid's visual schedule app to reduce
            anxiety and make daily routines smoother.
          </p>
          <Link href="/register">
            <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-lg shadow-xl shadow-amber-500/30 active:scale-95 transition-all hover:-translate-y-1">
              Create Your First Schedule →
            </button>
          </Link>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="pb-8 text-center">
        <Link href="/" className="text-slate-500 hover:text-amber-500 transition-colors">
          ← Back to Neuro Kid Home
        </Link>
      </div>
    </div>
  );
}
