"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Volume2, 
  Image, 
  MessageCircle, 
  Smartphone, 
  Sparkles, 
  Shield,
  Check,
  ArrowRight,
  Star,
  Play
} from "lucide-react";

export function AACLandingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;

  // Redirect logged-in users directly to the AAC app
  useEffect(() => {
    if (isLoggedIn && status !== "loading") {
      router.replace("/aac/app");
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
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Free AAC Communication Tool
            </div>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              AAC Communication App<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Designed for Autistic Children
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Give your child a voice. Our AAC app features customizable picture boards, 
              text-to-speech, and an autism-friendly interface designed for nonverbal 
              and minimally verbal children.
            </p>

            {/* CTAs - Only show for non-logged-in users */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 active:scale-95 transition-all hover:-translate-y-1 flex items-center gap-2">
                  Try AAC Free <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/aac/demo">
                <button className="px-8 py-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold text-lg transition-all hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  See Demo
                </button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-500">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 font-medium">4.9/5</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>Used by 10,000+ families</span>
              <span className="hidden sm:inline">•</span>
              <span>Free forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="AAC Features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Features Built for Autism
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Every feature designed with sensory needs, motor skills, and communication goals in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Image className="w-6 h-6" />,
                title: "Visual Picture Boards",
                description: "Customizable grids with clear, high-contrast symbols. Add your own photos for personalized communication.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: <Volume2 className="w-6 h-6" />,
                title: "Text-to-Speech",
                description: "Natural-sounding voices speak for your child. Multiple voice options to find the perfect match.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: <Smartphone className="w-6 h-6" />,
                title: "Works on Any Device",
                description: "Tablet, phone, or computer—Neuro Kid AAC works everywhere your child needs to communicate.",
                color: "from-purple-500 to-violet-500",
              },
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: "Sentence Builder",
                description: "Drag and drop symbols to build complete sentences. Help your child express complex thoughts.",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Privacy First",
                description: "Your child's communication data stays private. No ads, no data selling, ever.",
                color: "from-rose-500 to-pink-500",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "AI-Powered Suggestions",
                description: "Smart symbol recommendations based on context and your child's communication patterns.",
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

      {/* How It Works */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="How AAC Works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Getting Started is Simple
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              From first symbol to first sentence in minutes, not hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose a Board",
                description: "Start with pre-made boards for common needs: food, feelings, activities, or create your own.",
              },
              {
                step: "2",
                title: "Customize Symbols",
                description: "Add your child's favorite photos, adjust sizes for motor skills, organize by category.",
              },
              {
                step: "3",
                title: "Communicate",
                description: "Tap symbols to speak, build sentences, and watch your child's communication grow.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Parent Testimonial">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl p-8 sm:p-12 border border-emerald-500/20">
            <blockquote className="text-center">
              <p className="text-xl sm:text-2xl text-slate-800 dark:text-slate-200 font-serif italic mb-6 leading-relaxed">
                "After years of frustration, my son finally has a voice. Within a week of using Neuro Kid's AAC app, 
                he was telling us what he wanted for breakfast. It's changed our entire family's life."
              </p>
              <footer className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white">Sarah M.</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Mom to a 6-year-old with autism</p>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-white/[0.02]" aria-label="Frequently Asked Questions">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "What is an AAC app for autism?",
                a: "An AAC (Augmentative and Alternative Communication) app helps nonverbal or minimally verbal autistic children express themselves using pictures, symbols, and text-to-speech technology.",
              },
              {
                q: "Is Neuro Kid's AAC app really free?",
                a: "Yes! Our basic AAC features are completely free. Premium features like advanced customization and expanded symbol libraries are available with an affordable subscription.",
              },
              {
                q: "Can I use my own photos in the app?",
                a: "Absolutely. You can upload personal photos of family members, favorite foods, toys, and activities to create a truly personalized communication experience.",
              },
              {
                q: "Does it work offline?",
                a: "Yes, once loaded, the AAC boards work without an internet connection—perfect for use anywhere, anytime.",
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

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Get Started">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Give Your Child a Voice Today
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Join thousands of families using Neuro Kid's AAC app to help their children communicate. 
            Free to start, no credit card required.
          </p>
          <Link href="/register">
            <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 active:scale-95 transition-all hover:-translate-y-1">
              Start Communicating Free →
            </button>
          </Link>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/aac/demo">
              <button className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors flex items-center gap-2">
                <Play className="w-4 h-4" />
                Or watch a 3-minute demo first
              </button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            Takes less than 2 minutes to get started
          </p>
        </div>
      </section>

      {/* Footer Link */}
      <div className="pb-8 text-center">
        <Link href="/" className="text-slate-500 hover:text-emerald-500 transition-colors">
          ← Back to Neuro Kid Home
        </Link>
      </div>
    </div>
  );
}
