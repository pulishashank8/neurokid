"use client";

import Link from "next/link";
import { ArrowRight, Clock, Tag } from "lucide-react";

const blogPosts = [
  {
    slug: "how-to-choose-aac-app",
    title: "How to Choose the Right AAC App for Your Nonverbal Child",
    excerpt: "Learn what features to look for in an AAC communication app and how to find the best fit for your autistic child's needs.",
    category: "Communication",
    readTime: "6 min read",
    keyword: "best AAC app for nonverbal autism",
    linkTo: "/aac",
  },
  {
    slug: "autism-screening-guide",
    title: "What to Expect During an Autism Screening: A Parent's Guide",
    excerpt: "Understanding the autism screening process can reduce anxiety. Here's what happens during an evaluation and how to prepare.",
    category: "Screening",
    readTime: "8 min read",
    keyword: "autism screening process for toddlers",
    linkTo: "/screening",
  },
  {
    slug: "visual-schedule-templates",
    title: "Visual Schedule Templates for Autistic Kids (Free Printables + App)",
    excerpt: "Download free visual schedule templates or use our app to create custom routines that reduce anxiety and improve transitions.",
    category: "Daily Living",
    readTime: "5 min read",
    keyword: "free visual schedule template autism",
    linkTo: "/daily-wins",
  },
  {
    slug: "calming-techniques-meltdowns",
    title: "7 Calming Techniques That Work During Autism Meltdowns",
    excerpt: "Evidence-based strategies to help your child self-regulate during challenging moments. From deep pressure to sensory breaks.",
    category: "Behavior",
    readTime: "7 min read",
    keyword: "how to calm autistic child during meltdown",
    linkTo: "/calm",
  },
  {
    slug: "track-aba-therapy",
    title: "How to Track ABA Therapy Progress: A Parent's System",
    excerpt: "Simple methods for logging ABA sessions, tracking goals, and communicating effectively with your child's therapy team.",
    category: "Therapy",
    readTime: "6 min read",
    keyword: "ABA therapy progress tracking",
    linkTo: "/therapy-log",
  },
  {
    slug: "explaining-autism-to-child",
    title: "Explaining Autism to Your Child: Scripts and Story Examples",
    excerpt: "Age-appropriate ways to help your autistic child understand their diagnosis. Includes conversation scripts and social story templates.",
    category: "Communication",
    readTime: "8 min read",
    keyword: "how to explain autism to my autistic child",
    linkTo: "/stories",
  },
  {
    slug: "autism-parent-isolation",
    title: "The Isolation of Autism Parenting: Finding Your Community",
    excerpt: "You're not alone. Learn why autism parenting can feel isolating and how to build a support network that understands.",
    category: "Parent Support",
    readTime: "5 min read",
    keyword: "autism parent isolation support",
    linkTo: "/community",
  },
  {
    slug: "transition-strategies",
    title: "Transition Strategies for Kids with Autism: School, Home, and Outings",
    excerpt: "Practical tips for smoother transitions between activities, places, and routines. Reduce anxiety with these proven strategies.",
    category: "Daily Living",
    readTime: "7 min read",
    keyword: "autism transition strategies",
    linkTo: "/daily-wins",
  },
  {
    slug: "augmentative-communication",
    title: "Augmentative Communication: Beyond Basic Picture Cards",
    excerpt: "An introduction to AAC options for autistic children. From low-tech to high-tech solutions for every communication level.",
    category: "Communication",
    readTime: "9 min read",
    keyword: "augmentative communication autism",
    linkTo: "/aac",
  },
  {
    slug: "therapy-binder",
    title: "Setting Up a Therapy Binder: Digital vs. Paper Systems",
    excerpt: "Organize your child's therapy information, progress notes, and provider contacts. Compare digital and physical organization methods.",
    category: "Organization",
    readTime: "6 min read",
    keyword: "autism therapy organization binder",
    linkTo: "/therapy-log",
  },
];

const categories = [
  "All",
  "Communication",
  "Therapy",
  "Daily Living",
  "Behavior",
  "Parent Support",
  "Organization",
  "Screening",
];

export function BlogLandingContent() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[var(--background)] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6">
            Autism Resources & <span className="text-emerald-600 dark:text-emerald-400">Parenting Guides</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Expert articles, practical tips, and real stories to help you navigate the autism parenting journey.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" aria-label="Blog Posts">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <article 
                key={index}
                className="group bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Read Article <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link 
                      href={post.linkTo}
                      className="text-slate-500 dark:text-slate-500 text-xs hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      Related Tool →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-white/[0.02]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Get New Articles in Your Inbox
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Join our newsletter for weekly autism parenting tips, resources, and community updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all">
              Subscribe
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Back Link */}
      <div className="py-8 text-center">
        <Link href="/" className="text-slate-500 hover:text-emerald-500 transition-colors">
          ← Back to Neuro Kid Home
        </Link>
      </div>
    </div>
  );
}
