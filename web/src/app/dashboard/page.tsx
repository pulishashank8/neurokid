"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { Users, Stethoscope, Brain, ClipboardCheck, ArrowRight, LogOut, Activity, MessagesSquare, Bookmark, ShoppingBag, Sparkles } from "lucide-react";

// ... (rest of imports/code) 


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <p className="mt-4 text-[var(--muted)]">Loading...</p>
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
      description: "A safe space to share stories, ask questions, and find strength in numbers.",
      href: "/community",
      icon: <Users className="w-8 h-8" />,
      color: "bg-blue-500",
      stats: "Active Discussions",
    },
    {
      id: "providers",
      title: "Healthcare Providers",
      description: "Locate trusted professionals near you who specialize in neurodiverse care.",
      href: "/providers",
      icon: <Stethoscope className="w-8 h-8" />,
      color: "bg-rose-500",
      stats: "Verified Specialists",
    },
    {
      id: "ai-support",
      title: "AI Support",
      description: "Your always-available companion for guidance, resources, and quick answers.",
      href: "/ai-support",
      icon: <Brain className="w-8 h-8" />,
      color: "bg-purple-500",
      stats: "24/7 Assistance",
    },
    {
      id: "screening",
      title: "Autism Screening",
      description: "Validated screening tools to help you understand your child's developmental milestones.",
      href: "/screening",
      icon: <ClipboardCheck className="w-8 h-8" />,
      color: "bg-green-500",
      stats: "M-CHAT-R/F™",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header Section - Enhanced */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--surface)] to-[var(--background)] border-b border-[var(--border)] pt-10 pb-16">
        {/* Abstract Shapes for premium feel */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold uppercase tracking-wider w-fit">
                <Sparkles className="w-3 h-3" />
                Member Dashboard
              </div>
              <h1 className="text-4xl font-extrabold text-[var(--text)] tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-teal-500">{session?.user?.name || "Friend"}</span>!
              </h1>
              <p className="text-[var(--muted)] text-lg max-w-2xl leading-relaxed">
                Your safe space is ready. Explore new resources, connect with the community, or find support today.
              </p>
            </div>

            <button
              onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
              className="group flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-[var(--muted)] hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shadow-sm hover:shadow-md"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 -mt-8 pb-20 sm:px-6 lg:px-8 relative z-20">

        {/* Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <Link key={module.id} href={module.href}>
              <div className="group h-full cursor-pointer">
                <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 overflow-hidden relative">
                  {/* Hover Gradient Overlay */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${module.color}`}></div>

                  {/* Icon with Solid Background for Visibility */}
                  <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${module.color} text-white shadow-lg transition-transform group-hover:scale-110`}>
                    {module.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                        {module.title}
                      </h2>
                    </div>

                    <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
                      {module.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{module.stats}</span>
                    <div className="rounded-full bg-[var(--surface2)] p-2 text-[var(--text)] transition-all group-hover:bg-[var(--primary)] group-hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Dashboard Widgets Row */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Quick Stats Widget */}
          <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)]">Your Activity</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/screening" className="flex flex-col items-center justify-center rounded-xl bg-[var(--surface2)] p-4 text-center transition-all hover:bg-[var(--primary)] hover:text-white group">
                <ClipboardCheck className="w-6 h-6 mb-2 text-[var(--primary)] group-hover:text-white" />
                <span className="text-sm font-bold text-[var(--text)] group-hover:text-white">My Screenings</span>
              </Link>

              <Link href="/community" className="flex flex-col items-center justify-center rounded-xl bg-[var(--surface2)] p-4 text-center transition-all hover:bg-indigo-500 hover:text-white group">
                <MessagesSquare className="w-6 h-6 mb-2 text-indigo-500 group-hover:text-white" />
                <span className="text-sm font-bold text-[var(--text)] group-hover:text-white">My Posts</span>
              </Link>

              <Link href="/community" className="flex flex-col items-center justify-center rounded-xl bg-[var(--surface2)] p-4 text-center transition-all hover:bg-rose-500 hover:text-white group">
                <Bookmark className="w-6 h-6 mb-2 text-rose-500 group-hover:text-white" />
                <span className="text-sm font-bold text-[var(--text)] group-hover:text-white">Saved Items</span>
              </Link>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-slate-800 dark:border-slate-700">
              <p className="text-sm font-medium text-center text-indigo-900 dark:text-indigo-200">
                "Every step forward is a victory to be celebrated."
              </p>
            </div>
          </div>

          {/* Marketplace Widget - Redesigned */}
          <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-orange-50/50 dark:to-orange-950/20 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            {/* Background sparkle */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-xl text-orange-600 dark:text-orange-400 shadow-inner">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] leading-none">Marketplace</h3>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">Curated Store</span>
                </div>
              </div>

              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                Discover rated sensory toys, adaptive clothing, and tools to support your daily journey.
              </p>

              <Link
                href="/marketplace"
                className="group/btn relative w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 px-4 font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Browse Collection <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Disclaimer */}
      <div className="mt-20 border-t border-[var(--border)] bg-[var(--surface)] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-[10px] text-[var(--muted)] opacity-60 leading-relaxed max-w-3xl mx-auto uppercase tracking-wide">
            DISCLAIMER: NeuroKid is a personal project by Shashank Puli, created as an MVP for educational and demonstration purposes only.
            The content provided is not intended to replace professional medical advice, diagnosis, or treatment.
            Always seek the advice of a qualified health provider with any questions regarding a medical condition.
          </p>
          <p className="mt-2 text-[10px] text-[var(--muted)] opacity-40">
            © 2026 NeuroKid.
          </p>
        </div>
      </div>
    </div>
  );
}
