"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Users, Stethoscope, Brain, ClipboardCheck, ArrowRight,
  Heart, Wind, ClipboardList, Sparkles, Quote, ShoppingBag, Mail, Star, Gamepad2,
  MessageSquare, Volume2
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

// Floating Particles Component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 6}s`,
            width: `${4 + Math.random() * 4}px`,
            height: `${4 + Math.random() * 4}px`,
          }}
        />
      ))}
    </div>
  );
}

// Ambient Orbs Component
function AmbientOrbs() {
  return (
    <>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] orb-1">
        <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-[100px] morph-bg" />
      </div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] orb-2">
        <div className="w-full h-full bg-gradient-to-tr from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-[80px] morph-bg" style={{ animationDelay: '-5s' }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] orb-3">
        <div className="w-full h-full bg-gradient-to-r from-cyan-500/10 via-emerald-500/5 to-purple-500/10 rounded-full blur-[120px] morph-bg" style={{ animationDelay: '-10s' }} />
      </div>
    </>
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
    { href: "/screening", icon: ClipboardCheck, label: "Screening", gradient: "from-blue-500 to-cyan-500", glow: "blue" },
    { href: "/therapy-log", icon: ClipboardList, label: "Therapy Log", gradient: "from-purple-500 to-violet-500", glow: "purple" },
    { href: "/daily-wins", icon: Star, label: "Daily Wins", gradient: "from-amber-500 to-orange-500", glow: "amber" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <AmbientOrbs />
        <FloatingParticles />
      </div>

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]" />

      {/* Hero Header */}
      <div className="relative pt-8 pb-20">
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

          {/* Messages Card - Premium Design */}
          <Premium3DCard delay={800} enableTilt={false}>
            <Link href="/messages" className="group block mb-6">
              <div className="relative rounded-3xl glass-premium p-5 shadow-luxury hover:shadow-luxury-hover transition-all duration-500 border-glow overflow-hidden">
                {/* Animated gradient border */}
                <div className="absolute inset-0 rounded-3xl rotating-border opacity-0 group-hover:opacity-100" />

                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                  {/* Icon Section */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg btn-3d icon-container-luxury"
                      style={{ boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)' }}>
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    {notifications.totalUnread > 0 && (
                      <div className="absolute -top-2 -right-2 min-w-[24px] h-6 px-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-pulse">
                        {notifications.totalUnread > 99 ? "99+" : notifications.totalUnread}
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-gradient-animated">
                        Messages
                      </h2>
                      {notifications.totalUnread > 0 && (
                        <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                          {notifications.unreadConnectionRequests > 0 && `${notifications.unreadConnectionRequests} request${notifications.unreadConnectionRequests > 1 ? 's' : ''}`}
                          {notifications.unreadConnectionRequests > 0 && notifications.unreadMessages > 0 && ' • '}
                          {notifications.unreadMessages > 0 && `${notifications.unreadMessages} new`}
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--muted)] text-sm sm:text-base leading-relaxed max-w-lg">
                      Connect with other parents through private, secure conversations.
                    </p>
                  </div>

                  {/* CTA Button */}
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white text-sm font-bold shadow-lg btn-glow-luxury transition-all duration-300 group-hover:scale-105">
                      <span>Open Messages</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </Premium3DCard>

          {/* Support Tools & Marketplace - Premium Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Support Tools */}
            <Premium3DCard delay={900}>
              <div className="glass-premium rounded-3xl p-6 shadow-luxury border-glow h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg icon-container-luxury btn-3d"
                    style={{ boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)' }}>
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">Support Tools</h2>
                    <p className="text-xs text-[var(--muted)]">Free wellness resources</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {supportTools.map((tool, index) => {
                    const Icon = tool.icon;
                    return (
                      <Link key={tool.href} href={tool.href} className="group">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface2)]/50 hover:bg-[var(--surface2)] border border-transparent hover:border-[var(--primary)]/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 card-shine overflow-hidden">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-[var(--text)] flex-1">{tool.label}</span>
                          <ArrowRight className="w-4 h-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </Premium3DCard>

            {/* Right Column: Marketplace + Games stacked */}
            <div className="flex flex-col gap-5">
              {/* Marketplace Card */}
              <Premium3DCard delay={1000}>
                <Link href="/marketplace" className="group block">
                  <div className="relative glass-premium rounded-3xl p-5 shadow-luxury border-glow overflow-hidden transition-all duration-500 hover:shadow-luxury-hover hover:scale-[1.02]">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />

                    {/* Floating product icons */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {['🧸', '🎧', '📚'].map((emoji, i) => (
                        <div key={i} className={`w-8 h-8 rounded-xl glass-premium flex items-center justify-center text-sm shadow-md transition-transform duration-300 group-hover:scale-110`}
                          style={{ transitionDelay: `${i * 50}ms` }}>
                          {emoji}
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg icon-container-luxury"
                          style={{ boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)' }}>
                          <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--text)]">Marketplace</h2>
                      </div>

                      <p className="text-[var(--muted)] text-sm leading-relaxed mb-3">
                        Sensory toys, weighted blankets & more.
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {['Sensory', 'Safety', 'Learning'].map((cat) => (
                          <span key={cat} className="px-3 py-1 rounded-full glass-premium text-violet-600 dark:text-violet-300 text-xs font-semibold">
                            {cat}
                          </span>
                        ))}
                      </div>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-md btn-glow-luxury transition-all duration-300 group-hover:scale-105">
                        Browse
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Premium3DCard>

              {/* Games Section */}
              <Premium3DCard delay={1100}>
                <Link href="/games" className="group block">
                  <div className="relative glass-premium rounded-3xl p-5 shadow-luxury border-glow overflow-hidden transition-all duration-500 hover:shadow-luxury-hover hover:scale-[1.02]">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-cyan-500/5 to-indigo-500/5 rounded-3xl" />

                    {/* Floating game icons */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {['🧩', '🎮', '🌈'].map((emoji, i) => (
                        <div key={i} className={`w-8 h-8 rounded-xl glass-premium flex items-center justify-center text-sm shadow-md transition-transform duration-300 group-hover:scale-110`}
                          style={{ transitionDelay: `${i * 50}ms` }}>
                          {emoji}
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg icon-container-luxury"
                          style={{ boxShadow: '0 8px 30px rgba(14, 165, 233, 0.4)' }}>
                          <Gamepad2 className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--text)]">Fun & Learn Games</h2>
                      </div>

                      <p className="text-[var(--muted)] text-sm leading-relaxed mb-3">
                        10 calming games for kids.
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {['Memory', 'Patterns', 'Emotions'].map((cat) => (
                          <span key={cat} className="px-3 py-1 rounded-full glass-premium text-sky-600 dark:text-sky-300 text-xs font-semibold">
                            {cat}
                          </span>
                        ))}
                      </div>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 text-white font-bold text-sm shadow-md btn-glow-luxury transition-all duration-300 group-hover:scale-105">
                        Play Games
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
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
    </div>
  );
}
