"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Users, Stethoscope, Brain, ClipboardCheck, ArrowRight, 
  Heart, Wind, ClipboardList, Sparkles, Quote, ShoppingBag, Mail, Star, Gamepad2
} from "lucide-react";

const QUOTES = [
  { text: "Every child is gifted. They just unwrap their packages at different times.", author: "Unknown" },
  { text: "Different, not less.", author: "Temple Grandin" },
  { text: "Autism is not a tragedy. Ignorance is the tragedy.", author: "Kerry Magro" },
  { text: "The way we talk to our children becomes their inner voice.", author: "Peggy O'Mara" },
  { text: "In a world where you can be anything, be kind.", author: "Jennifer Dukes Lee" },
  { text: "The only disability in life is a bad attitude.", author: "Scott Hamilton" },
  { text: "Your child is not broken. They just see the world differently.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Embrace the unique spark in every child.", author: "Unknown" },
  { text: "Small steps lead to big changes.", author: "Unknown" },
  { text: "You are your child's best advocate.", author: "Unknown" },
  { text: "Neurodiversity is a strength, not a weakness.", author: "Unknown" },
  { text: "Patience and love can move mountains.", author: "Unknown" },
  { text: "Celebrate every milestone, no matter how small.", author: "Unknown" },
  { text: "Your love is their greatest therapy.", author: "Unknown" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [notifications, setNotifications] = useState({ unreadConnectionRequests: 0, unreadMessages: 0, totalUnread: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchNotifications = async () => {
        try {
          const res = await fetch("/api/notifications");
          if (res.ok) {
            const data = await res.json();
            setNotifications(data);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-[var(--muted)]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const modules = [
    {
      id: "community",
      title: "Community",
      description: "Connect with parents who understand your journey.",
      href: "/community",
      icon: <Users className="w-7 h-7" />,
      gradient: "from-emerald-500 to-teal-500",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      id: "providers",
      title: "Find Care",
      description: "Locate verified specialists in neurodiverse care.",
      href: "/providers",
      icon: <Stethoscope className="w-7 h-7" />,
      gradient: "from-rose-500 to-pink-500",
      shadowColor: "shadow-rose-500/20",
    },
    {
      id: "ai-support",
      title: "AI Companion",
      description: "24/7 guidance, resources, and quick answers.",
      href: "/ai-support",
      icon: <Brain className="w-7 h-7" />,
      gradient: "from-purple-500 to-violet-500",
      shadowColor: "shadow-purple-500/20",
    },
    {
      id: "screening",
      title: "M-CHAT Screening",
      description: "Validated developmental milestone assessment.",
      href: "/screening",
      icon: <ClipboardCheck className="w-7 h-7" />,
      gradient: "from-blue-500 to-cyan-500",
      shadowColor: "shadow-blue-500/20",
    },
  ];

  const supportTools = [
    { href: "/calm", icon: Wind, label: "Breathe & Calm", color: "text-emerald-500 bg-emerald-500/10" },
    { href: "/screening", icon: ClipboardCheck, label: "Screening", color: "text-blue-500 bg-blue-500/10" },
    { href: "/therapy-log", icon: ClipboardList, label: "Therapy Log", color: "text-purple-500 bg-purple-500/10" },
    { href: "/daily-wins", icon: Star, label: "Daily Wins", color: "text-amber-500 bg-amber-500/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--background)] via-[var(--surface)] to-[var(--background)]">
      {/* Hero Header */}
      <div className="relative overflow-hidden pt-8 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Your Safe Space
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight mb-2">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">{session?.user?.name || "Friend"}</span>
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-xl mx-auto">
              Your journey matters. Explore resources, connect with community, or find support today.
            </p>
          </div>

          {/* Inspirational Quote Card - Compact */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative bg-[var(--surface)] rounded-2xl border border-[var(--border)] px-6 py-5 shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Quote className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-[var(--text)] leading-relaxed italic">
                    "{quote.text}"
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)] font-semibold">
                    — {quote.author}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Modules Grid - 3D Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {modules.map((module) => (
              <Link key={module.id} href={module.href} className="group">
                <div className={`relative h-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-lg ${module.shadowColor} transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-transparent overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} text-white flex items-center justify-center shadow-lg ${module.shadowColor} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    {module.icon}
                  </div>
                  
                  <h3 className="relative z-10 text-xl font-bold text-[var(--text)] mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-500 transition-all">
                    {module.title}
                  </h3>
                  <p className="relative z-10 text-sm text-[var(--muted)] leading-relaxed mb-4">
                    {module.description}
                  </p>
                  
                  <div className="relative z-10 flex items-center text-sm font-semibold text-[var(--primary)] group-hover:gap-2 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Messages Card - Compact */}
          <Link href="/messages" className="group block mb-5">
            <div className="relative rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-lg bg-gradient-to-br from-[var(--surface)] via-indigo-50/30 to-violet-50/30 dark:via-indigo-950/10 dark:to-violet-950/10 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 hover:border-indigo-300/50 dark:hover:border-indigo-500/30">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                {/* Icon Section */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  {notifications.totalUnread > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                      {notifications.totalUnread > 99 ? "99+" : notifications.totalUnread}
                    </div>
                  )}
                </div>
                
                {/* Content Section */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400">
                      Messages
                    </h2>
                    {notifications.totalUnread > 0 && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                        {notifications.unreadConnectionRequests > 0 && `${notifications.unreadConnectionRequests} request${notifications.unreadConnectionRequests > 1 ? 's' : ''}`}
                        {notifications.unreadConnectionRequests > 0 && notifications.unreadMessages > 0 && ' • '}
                        {notifications.unreadMessages > 0 && `${notifications.unreadMessages} new`}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--muted)] text-sm leading-relaxed max-w-lg">
                    Connect with other parents through private, secure conversations.
                  </p>
                </div>
                
                {/* CTA Section */}
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
                    <span>Open Messages</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Support Tools & Marketplace - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Support Tools */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 shadow-md">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text)]">Support Tools</h2>
                  <p className="text-xs text-[var(--muted)]">Free wellness resources</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {supportTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link key={tool.href} href={tool.href} className="group">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface2)] border border-transparent hover:border-[var(--primary)]/30 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                        <div className={`w-9 h-9 rounded-lg ${tool.color} flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-sm font-medium text-[var(--text)]">{tool.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-auto text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Marketplace - Soft & Elegant Card */}
            <Link href="/marketplace" className="group block">
              <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 border border-violet-100 dark:border-violet-900/30">
                
                {/* Soft ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200/40 to-transparent dark:from-violet-500/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/30 to-transparent dark:from-purple-500/10 rounded-full blur-2xl" />
                
                {/* Floating product icons - soft style */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm shadow-sm border border-violet-100 dark:border-violet-800/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    🧸
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm shadow-sm border border-violet-100 dark:border-violet-800/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 delay-75">
                    🎧
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm shadow-sm border border-violet-100 dark:border-violet-800/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 delay-150">
                    📚
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-violet-900/30">
                      <ShoppingBag className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[var(--text)]">Marketplace</h2>
                      <p className="text-xs text-[var(--muted)]">Curated for your family</p>
                    </div>
                  </div>
                  
                  <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">
                    Sensory toys, weighted blankets, communication tools & more.
                  </p>
                  
                  {/* Category pills - soft pastel */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['Sensory', 'Safety', 'Learning', 'Comfort'].map((cat) => (
                      <span key={cat} className="px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-[10px] font-medium group-hover:bg-violet-200 dark:group-hover:bg-violet-800/40 transition-colors">
                        {cat}
                      </span>
                    ))}
                  </div>
                  
                  {/* Soft CTA Button */}
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm shadow-md shadow-violet-200 dark:shadow-violet-900/40 group-hover:shadow-lg group-hover:shadow-violet-300 dark:group-hover:shadow-violet-800/50 group-hover:-translate-y-0.5 transition-all duration-300">
                    Browse Collection
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Games Section - Below Marketplace */}
            <Link href="/games" className="group block mt-4">
              <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-violet-950/40 border border-sky-100 dark:border-sky-900/30">
                
                {/* Soft ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-200/40 to-transparent dark:from-sky-500/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-transparent dark:from-indigo-500/10 rounded-full blur-2xl" />
                
                {/* Floating game icons */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm shadow-sm border border-sky-100 dark:border-sky-800/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    🧩
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm shadow-sm border border-sky-100 dark:border-sky-800/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 delay-75">
                    🎮
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm shadow-sm border border-sky-100 dark:border-sky-800/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 delay-150">
                    🌈
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-200 dark:shadow-sky-900/30">
                      <Gamepad2 className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[var(--text)]">Fun & Learn Games</h2>
                      <p className="text-xs text-[var(--muted)]">10 calming games for kids</p>
                    </div>
                  </div>
                  
                  <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">
                    Simple puzzles, matching games & more - designed to be gentle and fun.
                  </p>
                  
                  {/* Game type pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['Memory', 'Patterns', 'Emotions', 'Counting'].map((cat) => (
                      <span key={cat} className="px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 text-[10px] font-medium group-hover:bg-sky-200 dark:group-hover:bg-sky-800/40 transition-colors">
                        {cat}
                      </span>
                    ))}
                  </div>
                  
                  {/* Soft CTA Button */}
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold text-sm shadow-md shadow-sky-200 dark:shadow-sky-900/40 group-hover:shadow-lg group-hover:shadow-sky-300 dark:group-hover:shadow-sky-800/50 group-hover:-translate-y-0.5 transition-all duration-300">
                    Play Games
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-[9px] text-[var(--muted)] opacity-50 leading-relaxed max-w-3xl mx-auto">
            NeuroKid provides general information and resources for educational purposes only. Content is not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers with questions about medical conditions.
          </p>
          <p className="mt-2 text-[9px] text-[var(--muted)] opacity-30">
            © 2026 NeuroKid
          </p>
        </div>
      </footer>
    </div>
  );
}
