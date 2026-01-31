"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/app/theme-provider";
import {
  ArrowRight, Users, Stethoscope, Brain,
  ClipboardCheck, Volume2, Shield, Heart, Globe, Sun, Moon, Quote
} from "lucide-react";

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

// Parenting & Neurodiversity Quotes
const QUOTATIONS = [
  "Your child is not a problem to be solved, but a mystery to be unfolded.",
  "If they can’t learn the way we teach, we teach the way they learn.",
  "Different, not less.",
  "Every milestone is a victory worth celebrating.",
  "Behavior is just communication that hasn't found its words yet.",
  "You were given this child because you are strong enough to guide them.",
  "Focus on what they can do, not what they can't.",
  "It takes a village, and we are your village.",
  "Small steps are still progress.",
  "Resilience is built in the moments you feel you can't go on, but do.",
  "Your journey is unique, and that makes it beautiful.",
  "To understand your child's heart, you must listen with more than just your ears.",
  "Kindness is a language the deaf can hear and the blind can see.",
  "There is no such thing as a perfect parent. Just a real one.",
  "Advocate. Educate. Love. Accept.",
  "The hardest days often lead to the greatest growth.",
  "In diversity there is beauty and there is strength.",
  "You are their best advocate and their safest harbor.",
  "Believe in the power of 'yet'.",
  "Parenthood is about guiding the next generation and forgiving the last.",
  "Don't compare your beginning to someone else's middle.",
  "Every child is gifted. They just unwrap their packages at different times.",
  "Love needs no words.",
  "Peace begins when expectation ends and acceptance begins.",
  "Connect, don't correct.",
  "Your love is the most powerful therapy.",
  "Look for the ability, not the disability.",
  "Growth is a slow process, but quitting speeds it up not at all.",
  "You are doing enough. You are enough.",
  "Celebrate the unique way your child sees the world."
];

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Quote Rotation Logic
  const [currentQuote, setCurrentQuote] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    // Change quote every 8 seconds
    const interval = setInterval(() => {
      setFade(false); // Start update (fade out)
      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % QUOTATIONS.length);
        setFade(true); // Fade back in
      }, 500); // 0.5s fade transition
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || status === "loading" || status === "authenticated") {
    // Loading State - Adaptive
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#05070a] transition-colors duration-500">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-widest text-slate-500 animate-pulse">Initializing Experience...</p>
        </div>
      </div>
    );
  }

  // Feature Pillars Data (Synced with Dashboard visuals)
  const services = [
    {
      title: "Community",
      desc: "Connect with parents who actually get it. No judgment, just support.",
      icon: <Users className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-emerald-500 via-emerald-400 to-teal-500",
      glowColor: "rgba(16, 185, 129, 0.4)",
      bgGlow: "bg-emerald-500/10",
    },
    {
      title: "Providers",
      desc: "Find verified specialists (ABA, OT, Speech) nearby without the headache.",
      icon: <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-rose-500 via-pink-500 to-rose-400",
      glowColor: "rgba(244, 63, 94, 0.4)",
      bgGlow: "bg-rose-500/10",
    },
    {
      title: "AI Support",
      desc: "Get instant answers for behavior & IEPs when you need them most.",
      icon: <Brain className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-purple-500 via-violet-500 to-purple-400",
      glowColor: "rgba(139, 92, 246, 0.4)",
      bgGlow: "bg-purple-500/10",
    },
    {
      title: "Screening",
      desc: "Track milestones privately with validated clinical tools.",
      icon: <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-blue-500 via-cyan-500 to-blue-400",
      glowColor: "rgba(59, 130, 246, 0.4)",
      bgGlow: "bg-blue-500/10",
    },
    {
      title: "AAC Voice",
      desc: "A voice for every child. Simple communication tools included.",
      icon: <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />,
      gradient: "from-amber-500 via-orange-500 to-amber-400",
      glowColor: "rgba(251, 146, 60, 0.5)",
      bgGlow: "bg-amber-500/10",
      isPremium: true,
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] text-slate-900 dark:text-white transition-colors duration-500 selection:bg-emerald-500/30 font-sans relative overflow-x-hidden">

      {/* 
        ATMOSPHERIC BACKGROUND (Dark Mode Only) 
        Keeps light mode clean and white.
      */}
      <div className="fixed inset-0 pointer-events-none hidden dark:block">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] orb-1 opacity-50"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] orb-2 opacity-50"></div>
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.02]"></div>
      </div>

      {/* Manual Theme Toggle - Fixed Top Right */}
      <div className="absolute top-6 right-6 z-50 animate-fade-in">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-all shadow-lg backdrop-blur-md border border-slate-200 dark:border-white/10"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5 text-slate-700" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative z-10 text-left">

        {/* HERO SECTION - REFINED & COMPACT */}
        <section className="pt-8 sm:pt-12 pb-8 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto text-center">

            {/* Top Logo Section - TIGHT MARGINS */}
            <div className="mb-1 animate-fade-up flex flex-col items-center justify-center">
              <Premium3DCard delay={0} enableTilt={true} className="inline-block mb-4">
                {/* Logo Container */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto group perspective-1000">
                  <div className="relative w-full h-full bg-gradient-to-br from-white to-slate-50 dark:from-white/10 dark:to-white/5 
                    backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-2xl p-4
                    shadow-md dark:shadow-2xl overflow-hidden transition-all duration-700 group-hover:scale-105"
                  >
                    <div className="absolute inset-0 -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg]"></div>
                    <img
                      src="/logo-icon.png"
                      alt="NeuroKid"
                      className="w-full h-full object-contain filter drop-shadow-sm relative z-10"
                    />
                  </div>
                </div>
              </Premium3DCard>

              {/* Product Name Below Logo */}
              {/* Product Name Below Logo */}
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                <span
                  className="bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent"
                  style={{ WebkitTextFillColor: 'transparent' }}
                >
                  NeuroKid
                </span>
              </h2>

              {/* ROTATING QUOTATION - Fills the gap tightly with minimal margin */}
              <div className="min-h-[1.5rem] mb-1 flex items-center justify-center w-full px-4">
                <p
                  className={`
                    text-xs sm:text-sm font-serif italic font-semibold text-slate-600 dark:text-slate-300 
                    transition-opacity duration-500 ease-in-out flex items-center gap-2
                    ${fade ? 'opacity-100' : 'opacity-0'}
                  `}
                >
                  <Quote className="w-3 h-3 text-emerald-500/50 rotate-180" />
                  {QUOTATIONS[currentQuote]}
                  <Quote className="w-3 h-3 text-emerald-500/50" />
                </p>
              </div>

            </div>

            {/* Single Line Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-6 text-slate-900 dark:text-white animate-reveal reveal-delay-1 whitespace-nowrap overflow-hidden text-ellipsis">
              Everything you need to support your child.
            </h1>

            {/* Refined Sub-headline */}
            <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6 animate-reveal reveal-delay-2 font-medium px-4">
              NeuroKid brings verified providers, community support, and interactive tools like educational games into one simple platform.
            </p>

            {/* Bold Tagline - "Never navigate alone" */}
            <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-10 animate-reveal reveal-delay-2 tracking-wide font-serif italic opacity-90">
              Never navigate the unknown alone.
            </p>

            {/* Side-by-Side CTA Buttons - Premium & Elegant */}
            <div className="flex flex-row items-center justify-center gap-4 animate-reveal reveal-delay-3 mb-10 w-full sm:w-auto mx-auto">
              <Link href="/register" className="w-auto">
                <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 active:scale-95 transition-all hover:-translate-y-1 ring-1 ring-white/20">
                  Start for Free
                </button>
              </Link>

              <Link href="/login" className="w-auto">
                <button className="px-8 py-4 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-lg active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-white/10 backdrop-blur-sm shadow-sm hover:shadow-md">
                  Welcome Back
                </button>
              </Link>
            </div>

            {/* Elegant Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-fade-up delay-300">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Shield className="w-4 h-4" /> Secure & Private
              </div>
              <span className="opacity-20 text-slate-400">|</span>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Globe className="w-4 h-4" /> For Every Family
              </div>
              <span className="opacity-20 text-slate-400">|</span>
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <Heart className="w-4 h-4" /> Parent Trusted
              </div>
            </div>
          </div>
        </section>


        {/* OUR PURPOSE SECTION - COMPACT */}
        <section className="py-10 bg-slate-50/50 dark:bg-white/[0.02] border-y border-slate-100 dark:border-white/5">
          <div className="max-w-3xl mx-auto px-6 text-center">

            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white animate-fade-up">Our Purpose</h2>
            <div className="w-10 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full mb-6"></div>

            <p className="text-lg sm:text-xl leading-relaxed text-slate-700 dark:text-slate-300 font-serif italic mb-6">
              "When you get a diagnosis, you get a label, not a roadmap."
            </p>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              We built NeuroKid to be that roadmap. A village in your pocket where you can find answers, track progress, and connect with people who actually understand.
            </p>
          </div>
        </section>


        {/* ECOSYSTEM / FEATURES SECTION - Consistent */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-10">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-xs mb-3 block">What's Inside</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">A Complete Ecosystem</h2>
              <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl mx-auto">
                Everything you need to navigate your child's journey, in one beautiful place.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 w-full">
              {services.map((pillar, index) => (
                <Premium3DCard
                  key={index}
                  delay={index * 100}
                  enableTilt={false}
                  className="h-full"
                >
                  <div className={`
                    relative h-full w-full rounded-2xl glass-premium
                    p-6
                    shadow-luxury hover:shadow-luxury-hover
                    transition-all duration-300 ease-out
                    border-glow card-shine overflow-hidden
                    hover:-translate-y-2 hover:scale-[1.02]
                    flex flex-col items-center justify-start text-center
                    bg-white/50 dark:bg-[#0d1117]/50
                    ${pillar.isPremium ? 'ring-2 ring-amber-500/30' : ''}
                  `}>
                    <div className={`absolute inset-0 ${pillar.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div
                      className={`
                        relative z-10
                        w-12 h-12
                        rounded-xl bg-gradient-to-br ${pillar.gradient}
                        text-white flex items-center justify-center
                        shadow-lg transition-transform duration-300
                        group-hover:scale-110
                        btn-3d icon-container-luxury
                        mb-4
                      `}
                      style={{ boxShadow: `0 8px 30px ${pillar.glowColor}` }}
                    >
                      {pillar.icon}
                    </div>
                    <h3 className="relative z-10 text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {pillar.title}
                    </h3>
                    <p className="relative z-10 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {pillar.desc}
                    </p>
                    {pillar.isPremium && (
                      <div className="absolute top-3 right-3">
                        <span className="flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      </div>
                    )}
                  </div>
                </Premium3DCard>
              ))}
            </div>
          </div>
        </section>


        {/* FOOTER */}
        <footer className="py-8 border-t border-slate-200 dark:border-white/5 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-xl leading-relaxed uppercase tracking-wider mb-2">
              Disclaimer: NeuroKid is a personal project created for educational purposes.
              Content provided is not a substitute for professional medical advice.
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-700 font-bold">
              © 2026 NeuroKid. All Rights Reserved.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
