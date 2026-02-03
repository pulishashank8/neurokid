"use client";

import Link from "next/link";
import { 
  BookOpen, 
  Sparkles, 
  Printer, 
  Volume2,
  Heart,
  ArrowRight,
  Check,
  Wand2,
  Clock
} from "lucide-react";

export function StoriesLandingContent() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-[var(--background)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Story Generator
            </div>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              Social Stories Made<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                Simple & Personal
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create personalized <strong>social stories</strong> in seconds. Help your child understand 
              new situations, routines, and social skills with AI-generated stories tailored 
              specifically to their needs.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg shadow-lg shadow-purple-500/30 active:scale-95 transition-all hover:-translate-y-1 flex items-center gap-2">
                  Create Free Stories <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/stories/examples">
                <button className="px-8 py-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold text-lg transition-all hover:bg-slate-50 dark:hover:bg-white/10">
                  See Examples
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="How It Works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Create Stories in 3 Simple Steps
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              No writing skills needed. Our AI does the work for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: <Wand2 className="w-6 h-6" />,
                title: "Describe the Situation",
                description: "Tell us what your child needs help with—a doctor visit, new school, haircut, or any new experience.",
                color: "from-purple-500 to-violet-500",
              },
              {
                step: "2",
                icon: <Clock className="w-6 h-6" />,
                title: "AI Generates Story",
                description: "In seconds, our AI creates a personalized story with your child's name and age-appropriate language.",
                color: "from-pink-500 to-rose-500",
              },
              {
                step: "3",
                icon: <BookOpen className="w-6 h-6" />,
                title: "Read or Print",
                description: "Read the story together on any device, print it as a PDF, or have it read aloud.",
                color: "from-indigo-500 to-blue-500",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white mx-auto mb-6 shadow-lg`}>
                  {item.icon}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white mx-auto mb-4">
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

      {/* Features */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="Story Features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Stories Built for Your Child
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Every story is personalized and designed to be effective for autistic learners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Heart className="w-6 h-6" />,
                title: "Personalized",
                description: "Stories include your child's name and are tailored to their age and communication level.",
              },
              {
                icon: <Volume2 className="w-6 h-6" />,
                title: "Read Aloud",
                description: "Built-in text-to-speech reads stories aloud, perfect for bedtime or on-the-go.",
              },
              {
                icon: <Printer className="w-6 h-6" />,
                title: "Print Ready",
                description: "Download as PDF to create a physical book your child can hold and revisit.",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Visual-Friendly",
                description: "Stories are written with clear, concrete language—perfect for visual learners.",
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Popular Story Topics">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Popular Story Topics
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Parents create stories for these situations every day.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { topic: "First Dentist Visit", icon: "🦷" },
              { topic: "Starting School", icon: "🏫" },
              { topic: "Getting a Haircut", icon: "✂️" },
              { topic: "New Baby Sibling", icon: "👶" },
              { topic: "Doctor Check-up", icon: "🩺" },
              { topic: "Going on Vacation", icon: "✈️" },
              { topic: "Bedtime Routine", icon: "🌙" },
              { topic: "Playdate with Friends", icon: "🤝" },
              { topic: "Handling Loud Noises", icon: "🔇" },
              { topic: "Trying New Foods", icon: "🍎" },
              { topic: "Shopping Trip", icon: "🛒" },
              { topic: "Birthday Party", icon: "🎂" },
            ].map((item, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-purple-500/50 transition-all hover:shadow-md text-center"
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <p className="font-medium text-slate-900 dark:text-white text-sm">{item.topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Story Preview */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] px-4 sm:px-6 lg:px-8" aria-label="Sample Story">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              See a Sample Story
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Here's what a generated story looks like.
            </p>
          </div>

          <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-purple-600 dark:text-purple-400">
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">Example: Going to the Dentist</span>
            </div>
            <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p className="font-serif text-lg">
                <strong>My Trip to the Dentist</strong>
              </p>
              <p>
                Today, Alex is going to the dentist. The dentist is a doctor who helps keep teeth healthy and strong.
              </p>
              <p>
                First, Alex will sit in a special chair. The chair can go up and down. It might feel funny, and that's okay.
              </p>
              <p>
                Next, the dentist will count Alex's teeth. The dentist will use a small mirror to look at each tooth. This doesn't hurt.
              </p>
              <p>
                The dentist might use a special toothbrush to clean Alex's teeth. It will tickle and make a buzzing sound. Alex can ask for a break if needed.
              </p>
              <p>
                When the dentist is finished, Alex will get a prize for being brave! Then we will go home.
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                Going to the dentist helps keep my teeth healthy. I can do this!
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-500">Generated in 5 seconds</span>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors">
                  <Printer className="w-4 h-4 inline mr-1" /> Print
                </button>
                <button className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors">
                  <Volume2 className="w-4 h-4 inline mr-1" /> Read Aloud
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-label="Testimonial">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-8 sm:p-12 border border-purple-500/20">
            <blockquote className="text-center">
              <p className="text-xl sm:text-2xl text-slate-800 dark:text-slate-200 font-serif italic mb-6 leading-relaxed">
                "The dentist story was a game-changer. My son was terrified of dental visits, but after 
                reading his personalized story for a week before the appointment, he walked in 
                confidently. The hygienist couldn't believe how calm he was!"
              </p>
              <footer className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  R
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white">Rachel K.</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Mom to a 4-year-old with autism</p>
                </div>
              </footer>
            </blockquote>
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
                q: "What are social stories?",
                a: "Social stories are personalized narratives that help autistic children understand what to expect in social situations. They reduce anxiety by making the unknown familiar.",
              },
              {
                q: "How many free stories can I create?",
                a: "Free accounts can generate up to 5 stories per month. Premium accounts get unlimited story generation.",
              },
              {
                q: "Can I edit the generated stories?",
                a: "Yes! You can customize any story after it's generated—change details, add photos, or adjust the language to match your child's needs.",
              },
              {
                q: "Are the stories evidence-based?",
                a: "Our AI is trained on established social story frameworks used by therapists and educators. Stories follow best practices for autistic learners.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
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
            Help Your Child Navigate New Experiences
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Create personalized social stories in seconds. Free to start, no credit card required.
          </p>
          <Link href="/register">
            <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg shadow-xl shadow-purple-500/30 active:scale-95 transition-all hover:-translate-y-1">
              Create Your First Story →
            </button>
          </Link>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            5 free stories per month
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="pb-8 text-center">
        <Link href="/" className="text-slate-500 hover:text-purple-500 transition-colors">
          ← Back to Neuro Kid Home
        </Link>
      </div>
    </div>
  );
}
