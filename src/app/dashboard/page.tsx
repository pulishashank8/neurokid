"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Users, Stethoscope, Brain, ClipboardCheck, ArrowRight,
  Heart, Wind, ClipboardList, Sparkles, Quote, ShoppingBag, Mail, Star, Gamepad2,
  MessageSquare, Volume2, Map
} from "lucide-react";
import dynamic from "next/dynamic";



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

// 3D Tilt Effect Hook
function use3DTilt() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    };

    const handleMouseLeave = () => {
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return ref;
}

// Premium 3D Card Component
function Premium3DCard({ children, className = "", delay = 0, enableTilt = true }: { children: React.ReactNode; className?: string; delay?: number; enableTilt?: boolean }) {
  const tiltRef = use3DTilt();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={enableTilt ? tiltRef : null}
      className={`
        ${className}
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
      style={{
        transformStyle: 'preserve-3d',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}



export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [notifications, setNotifications] = useState({ unreadConnectionRequests: 0, unreadMessages: 0, totalUnread: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-teal-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-[var(--muted)] animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  // 5-Pillar System: Community | Providers | AI Support | Screening | AAC Communicator
  const pillars = [
    {
      id: "community",
      title: "Community",
      shortTitle: "Community",
      description: "Connect with parents who understand your journey.",
      href: "/community",
      icon: <Users className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-emerald-500 via-emerald-400 to-teal-500",
      glowColor: "rgba(16, 185, 129, 0.4)",
      bgGlow: "bg-emerald-500/10",
    },
    {
      id: "providers",
      title: "Providers",
      shortTitle: "Providers",
      description: "Locate verified specialists in neurodiverse care.",
      href: "/providers",
      icon: <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-rose-500 via-pink-500 to-rose-400",
      glowColor: "rgba(244, 63, 94, 0.4)",
      bgGlow: "bg-rose-500/10",
    },
    {
      id: "ai-support",
      title: "AI Support",
      shortTitle: "AI",
      description: "24/7 guidance, resources, and quick answers.",
      href: "/ai-support",
      icon: <Brain className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-purple-500 via-violet-500 to-purple-400",
      glowColor: "rgba(139, 92, 246, 0.4)",
      bgGlow: "bg-purple-500/10",
    },
    {
      id: "screening",
      title: "Screening",
      shortTitle: "Screen",
      description: "Validated developmental milestone assessment.",
      href: "/screening",
      icon: <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-blue-500 via-cyan-500 to-blue-400",
      glowColor: "rgba(59, 130, 246, 0.4)",
      bgGlow: "bg-blue-500/10",
    },
    {
      id: "aac",
      title: "AAC Communicator",
      shortTitle: "AAC",
      description: "Voice communication board for non-verbal expression.",
      href: "/aac",
      icon: <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-amber-500 via-orange-500 to-amber-400",
      glowColor: "rgba(251, 146, 60, 0.5)",
      bgGlow: "bg-amber-500/10",
      isPremium: true, // This pillar gets the pulse-glow effect
    },
  ];

  const supportTools = [
    { href: "/calm", icon: Wind, label: "Breathe & Calm", gradient: "from-emerald-500 to-teal-500", glow: "emerald" },
    { href: "/autism-navigator", icon: Map, label: "Support Navigator", gradient: "from-blue-500 to-cyan-500", glow: "blue" },
    { href: "/therapy-log", icon: ClipboardList, label: "Therapy Log", gradient: "from-purple-500 to-violet-500", glow: "purple" },
    { href: "/daily-wins", icon: Star, label: "Daily Wins", gradient: "from-amber-500 to-orange-500", glow: "amber" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] relative overflow-hidden transition-colors duration-500">
      {/* Premium Atmospheric Background (Dark Mode only) */}
      <div className="fixed inset-0 pointer-events-none hidden dark:block">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px] orb-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] orb-2"></div>
        <div className="absolute top-[30%] right-[20%] w-[15%] h-[15%] bg-purple-500/5 rounded-full blur-[100px] orb-3"></div>

        {/* Slow particles */}
        <div className="particle opacity-30"></div>
        <div className="particle opacity-20"></div>
        <div className="particle opacity-30"></div>
      </div>

      {/* Hero Header */}
      <div className="relative pt-32 pb-20">
        {/* Mascot - Desktop positioned absolutely */}


        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Welcome Section - with responsive padding for mascot */}
          <div className="text-center mb-10">


            <Premium3DCard delay={0}>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-premium shadow-luxury mb-8 border-glow">
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <div className="absolute inset-0 animate-pulse">
                    <Sparkles className="w-4 h-4 text-emerald-500 opacity-50" />
                  </div>
                </div>
                <span className="text-sm font-semibold text-[var(--text)]">Your Safe Space</span>
              </div>
            </Premium3DCard>

            <Premium3DCard delay={100}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text)] tracking-tight mb-3">
                Welcome back,{" "}
                <span className="text-gradient-animated">
                  {session?.user?.name || "Friend"}
                </span>
              </h1>
            </Premium3DCard>

            <Premium3DCard delay={200}>
              <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
                Your journey matters. Explore resources, connect with community, or find support today.
              </p>
            </Premium3DCard>


          </div>

          {/* Inspirational Quote Card - Compact 3D & Centered */}
          <Premium3DCard delay={300} className="max-w-2xl mx-auto mb-12" enableTilt={false}>
            <div className="relative glass-premium rounded-3xl px-8 py-5 shadow-luxury quote-card-premium border-glow overflow-hidden">
              {/* Shimmer overlay */}
              <div className="absolute inset-0 shimmer-luxury opacity-30 rounded-3xl" />

              <div className="relative z-10 flex items-center gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg icon-container-luxury btn-3d">
                  <Quote className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-base sm:text-lg font-medium text-[var(--text)] leading-relaxed italic">
                    "{quote.text}"
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--muted)] font-bold uppercase tracking-wide flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-emerald-500/50 rounded-full" />
                    {quote.author}
                  </p>
                </div>
              </div>
            </div>
          </Premium3DCard>

          {/* 5-Pillar Navigation - Responsive Grid - Full Width - Individual Cards */}
          <div className="mb-8 sm:mb-12 w-full">
            <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 w-full">
              {pillars.map((pillar, index) => (
                <Premium3DCard
                  key={pillar.id}
                  delay={350 + (index * 100)}
                  enableTilt={false} // Disable bending
                  className="h-full"
                >
                  <Link
                    href={pillar.href}
                    className="group block h-full"
                  >
                    <div className={`
                      relative h-full w-full rounded-2xl sm:rounded-3xl glass-premium
                      p-4 sm:p-5 lg:p-6
                      shadow-luxury hover:shadow-luxury-hover
                      transition-all duration-300 ease-out
                      border-glow card-shine overflow-hidden
                      hover:-translate-y-2 hover:scale-[1.02]
                      flex flex-col items-center justify-start text-center
                      ${pillar.isPremium ? 'ring-2 ring-amber-500/30' : ''}
                    `}>
                      {/* Background Glow on Hover */}
                      <div className={`absolute inset-0 ${pillar.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                      {/* Icon */}
                      <div
                        className={`
                          relative z-10
                          w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20
                          rounded-xl sm:rounded-2xl bg-gradient-to-br ${pillar.gradient}
                          text-white flex items-center justify-center
                          shadow-lg transition-transform duration-300
                          group-hover:scale-110
                          btn-3d icon-container-luxury
                          mb-4 lg:mb-6
                        `}
                        style={{ boxShadow: `0 8px 30px ${pillar.glowColor}` }}
                      >
                        {pillar.icon}
                      </div>

                      {/* Title */}
                      <h3 className="relative z-10 text-sm sm:text-base lg:text-xl font-bold text-[var(--text)] group-hover:text-gradient-animated transition-all duration-300 leading-tight mb-2">
                        {pillar.title}
                      </h3>

                      {/* Description */}
                      <p className="hidden sm:block relative z-10 text-xs sm:text-sm text-[var(--muted)] leading-tight px-1 lg:px-2">
                        {pillar.description}
                      </p>

                      {/* Premium badge for AAC */}
                      {pillar.isPremium && (
                        <div className="absolute top-3 right-3">
                          <span className="flex h-3 w-3">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </Premium3DCard>
              ))}
            </nav>
          </div>

          {/* Main Dashboard Grid - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

            {/* LEFT COLUMN: AI Stories & Messages */}
            <div className="flex flex-col gap-6">

              {/* AI Stories Widget */}
              <Premium3DCard delay={600} enableTilt={false}>
                <Link href="/stories" className="group block h-full">
                  <div className="relative rounded-3xl glass-premium p-6 shadow-luxury hover:shadow-luxury-hover transition-all duration-500 border-glow overflow-hidden h-full">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/5 rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg btn-3d icon-container-luxury">
                          <Brain className="w-7 h-7 text-white" />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                          Interactive
                        </div>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold text-[var(--text)] mb-2 group-hover:text-amber-500 transition-colors">
                          AI Stories & Rhymes
                        </h2>
                        <p className="text-[var(--muted)] leading-relaxed">
                          Create magical, personalized stories and rhymes for your child in seconds.
                        </p>
                      </div>

                      <div className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-amber-500 group-hover:text-amber-600 transition-colors">
                        Start Creating <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Premium3DCard>

              {/* Messages Widget */}
              <Premium3DCard delay={800} enableTilt={false} className="h-full">
                <Link href="/messages" className="group block h-full">
                  <div className="relative rounded-3xl glass-premium px-4 py-3 shadow-luxury hover:shadow-luxury-hover transition-all duration-500 border-glow overflow-hidden h-full">
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 rounded-3xl rotating-border opacity-0 group-hover:opacity-100" />

                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex flex-col justify-between h-full gap-1">
                      <div>
                        {/* Icon Section */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-md btn-3d icon-container-luxury"
                            style={{ boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
                            <Mail className="w-4 h-4 text-white" />
                          </div>
                          {notifications.totalUnread > 0 && (
                            <div className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold shadow-md animate-pulse">
                              {notifications.totalUnread > 99 ? "99+" : `${notifications.totalUnread} new`}
                            </div>
                          )}
                        </div>

                        {/* Content Section */}
                        <div>
                          <h2 className="text-base font-bold text-[var(--text)] group-hover:text-indigo-500 transition-colors mb-1">
                            Messages
                          </h2>
                          <p className="text-[var(--muted)] text-[10px] leading-tight line-clamp-2">
                            Chat securely.
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 group-hover:text-indigo-600 transition-colors">
                        Open <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Premium3DCard>

              {/* Games Section */}
              <Premium3DCard delay={1000} className="h-full">
                <Link href="/games" className="group block h-full">
                  <div className="relative glass-premium rounded-3xl p-6 shadow-luxury border-glow overflow-hidden transition-all duration-500 hover:shadow-luxury-hover hover:scale-[1.02] h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-cyan-500/5 to-indigo-500/5 rounded-3xl" />
                    <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg icon-container-luxury">
                            <Gamepad2 className="w-6 h-6 text-white" />
                          </div>
                          <h2 className="text-lg font-bold text-[var(--text)]">Fun & Learn Games</h2>
                        </div>
                      </div>
                      <div className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 text-white font-bold text-sm shadow-md btn-glow-luxury transition-all duration-300 group-hover:scale-105 w-full justify-center">
                        Play Games <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Premium3DCard>

            </div>

            {/* RIGHT COLUMN: 1 Row + 2 Row Span */}
            <div className="grid grid-rows-3 gap-6 h-full">

              {/* Marketplace Card - Row Span 1 */}
              <Premium3DCard delay={1000} className="h-full row-span-1">
                <Link href="/marketplace" className="group block h-full">
                  <div className="relative glass-premium rounded-3xl p-6 shadow-luxury border-glow overflow-hidden transition-all duration-500 hover:shadow-luxury-hover hover:scale-[1.02] h-full">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />

                    <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg icon-container-luxury">
                            <ShoppingBag className="w-6 h-6 text-white" />
                          </div>
                          <h2 className="text-lg font-bold text-[var(--text)]">Marketplace</h2>
                        </div>

                        <p className="text-[var(--muted)] text-sm leading-relaxed mb-4 line-clamp-2">
                          Sensory toys & tools.
                        </p>
                      </div>

                      <div className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-md btn-glow-luxury transition-all duration-300 group-hover:scale-105 w-full justify-center">
                        Browse Shop
                      </div>
                    </div>
                  </div>
                </Link>
              </Premium3DCard>

              {/* Support Tools Block - Row Span 2 */}
              <Premium3DCard delay={900} className="h-full row-span-2">
                <div className="glass-premium rounded-3xl p-6 shadow-luxury border-glow h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-5 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg icon-container-luxury btn-3d">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--text)]">Support Tools</h2>
                  </div>
                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {supportTools.map((tool, index) => {
                      const Icon = tool.icon;
                      return (
                        <Link key={`${tool.href}-${index}`} href={tool.href} className="group flex-shrink-0">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface2)]/50 hover:bg-[var(--surface2)] border border-transparent hover:border-[var(--primary)]/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 card-shine overflow-hidden">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-[var(--text)] flex-1">{tool.label}</span>
                            <ArrowRight className="w-3 h-3 text-[var(--muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </Premium3DCard>

            </div>
          </div>
        </div>
      </div>
      {/* Footer Disclaimer - Premium */}
      <footer className="relative z-10 border-t border-[var(--border)] glass-premium py-10 mt-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs text-[var(--muted)] opacity-60 leading-relaxed max-w-3xl mx-auto">
            NeuroKid provides general information and resources for educational purposes only. Content is not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers with questions about medical conditions.
          </p>
          <p className="mt-3 text-xs text-[var(--muted)] opacity-40">
            © 2026 NeuroKid
          </p>
        </div>
      </footer>
    </div >
  );
}
