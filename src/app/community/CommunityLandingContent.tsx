"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Users, 
  Heart, 
  Shield, 
  MessageCircle, 
  Sparkles,
  ArrowRight,
  Check,
  Lock,
  MessageSquare
} from "lucide-react";

export function CommunityLandingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;

  // Redirect logged-in users directly to the community discussions
  useEffect(() => {
    if (isLoggedIn && status !== "loading") {
      router.replace("/community/discussions");
    }
  }, [isLoggedIn, status, router]);

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If logged in, don't render the landing page (will redirect)
  if (isLoggedIn) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6">
              <Users className="w-4 h-4" />
              10,000+ Parents Strong
            </div>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              A Community That<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Gets It
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of parents who understand the journey. Ask questions, share experiences, 
              and find support in our judgment-free <strong>autism parent community</strong>. 
              Anonymity isn't hiding—it's healing.
            </p>

            {/* CTAs - Show different buttons based on login status */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isLoggedIn ? (
                // Logged in users - Go to actual community
                <Link href="/community/discussions">
                  <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 active:scale-95 transition-all hover:-translate-y-1 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Enter Community
                  </button>
                </Link>
              ) : (
                // Not logged in - Show register/login
                <>
                  <Link href="/register">
                    <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 active:scale-95 transition-all hover:-translate-y-1 flex items-center gap-2">
                      Join the Community <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                  <Link href="/community/discussions">
                    <button className="px-8 py-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold text-lg transition-all hover:bg-slate-50 dark:hover:bg-white/10">
                      Browse Discussions
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Community Features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Real Questions, Real Answers
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              A safe space where you can be honest about the challenges and celebrate the victories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: "Ask Anything",
                description: "No question is too small or too big. From bedtime routines to IEP meetings, get answers from parents who've been there.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: <Heart className="w-6 h-6" />,
                title: "Judgment-Free Zone",
                description: "Share struggles without fear of criticism. Our community is built on empathy, not judgment.",
                color: "from-rose-500 to-pink-500",
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: "Post Anonymously",
                description: "Choose to share your name or post anonymously. Your comfort and privacy come first.",
                color: "from-purple-500 to-violet-500",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Moderated for Safety",
                description: "Active moderation keeps the community kind and respectful. Toxicity is not tolerated here.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Celebrate Wins",
                description: "Share milestones and victories with people who truly understand how meaningful they are.",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Connect Privately",
                description: "Message other parents one-on-one to build deeper connections and friendships.",
                color: "from-indigo-500 to-blue-500",
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 transition-all hover:-translate-y-1 hover:shadow-xl"
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

      {/* Topics */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="Discussion Topics">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Topics Parents Discuss Most
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Whatever you're going through, someone else is too.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "ABA Therapy",
              "School & IEPs",
              "Sleep Issues",
              "Communication",
              "Meltdowns",
              "Sensory Needs",
              "Food & Diet",
              "Sibling Support",
              "Transitions",
              "Social Skills",
              "Medication",
              "Self-Care",
            ].map((topic, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center hover:border-emerald-500/50 transition-all hover:shadow-md"
              >
                <p className="font-medium text-slate-900 dark:text-white">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Community Testimonials">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              What Parents Are Saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "I felt so alone until I found this community. For the first time, people actually understood what I was going through.",
                author: "Jennifer L.",
                role: "Mom to a 4-year-old with autism",
              },
              {
                quote: "The advice I got about my son's IEP was invaluable. Other parents helped me advocate effectively and get the services he needed.",
                author: "Michael R.",
                role: "Dad to a 7-year-old with autism",
              },
              {
                quote: "Being able to post anonymously helped me ask questions I was too embarrassed to ask anywhere else. This community saved my sanity.",
                author: "Anonymous",
                role: "Parent of a recently diagnosed child",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl p-8 border border-emerald-500/10">
                <p className="text-slate-700 dark:text-slate-300 font-serif italic mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="Community Guidelines">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Community Guidelines
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Simple rules to keep this a safe, supportive space for everyone.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "🚫", title: "No Medical Advice", desc: "Share experiences, not prescriptions. Always consult professionals for medical decisions." },
              { icon: "❤️", title: "Be Supportive & Kind", desc: "Everyone is at a different point in their journey. Offer encouragement, not judgment." },
              { icon: "🔒", title: "Respect Privacy", desc: "What's shared here stays here. Don't share others' stories outside the community." },
              { icon: "✅", title: "Celebrate Diversity", desc: "Every child and family is unique. Respect different approaches and experiences." },
            ].map((rule, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                <span className="text-2xl">{rule.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{rule.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{rule.desc}</p>
                </div>
              </div>
            ))}
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
                q: "Is the community really free?",
                a: "Yes! Joining and participating in the Neuro Kid community is completely free. We believe every parent deserves support.",
              },
              {
                q: "Do I have to use my real name?",
                a: "Not at all. You can create a username and post anonymously. Your privacy is important to us.",
              },
              {
                q: "What if someone is unkind?",
                a: "We have zero tolerance for bullying or judgment. Report any issues and our moderation team will take immediate action.",
              },
              {
                q: "Can professionals join?",
                a: "While our community is primarily for parents, qualified professionals can join to learn, not to promote services.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
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
      <section className="py-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 px-4 sm:px-6 lg:px-8" aria-label="Join Community">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Join Our Village Today
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            You don't have to navigate this journey alone. Connect with parents who understand 
            and find the support you deserve.
          </p>
          {isLoggedIn ? (
            <Link href="/community/discussions">
              <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 active:scale-95 transition-all hover:-translate-y-1">
                Enter Community →
              </button>
            </Link>
          ) : (
            <Link href="/register">
              <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 active:scale-95 transition-all hover:-translate-y-1">
                Join the Community Free →
              </button>
            </Link>
          )}
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="pb-8 text-center">
        <Link href="/" className="text-slate-500 hover:text-emerald-500 transition-colors">
          ← Back to Neuro Kid Home
        </Link>
      </div>
    </div>
  );
}
