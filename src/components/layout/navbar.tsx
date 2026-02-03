"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/app/theme-provider";

import {
  ChevronDown,
  Users,
  Stethoscope,
  Brain,
  ClipboardCheck,
  BookOpen,
  Shield,
  Settings,
  Info,
  Menu,
  X,
  Heart,
  Phone,
  Wind,
  ClipboardList,
  CreditCard,
  ShoppingBag,
  LogOut,
  Sun,
  Moon,
  MessageCircle,
  MessageSquare,
  Star,
  Gamepad2,
  Grid3X3,
  Palette,
  Shapes,
  Puzzle,
  Smile,
  Circle,
  Music,
  ListOrdered,
  Search,
  Sparkles,
  Map,
  Compass
} from "lucide-react";

type SubItem = { href: string; label: string; icon: any; description: string };
type NavGroup = { label: string; items: SubItem[] };

const getNavGroups = (isLoggedIn: boolean): NavGroup[] => [
  {
    label: "Community",
    items: [
      { href: isLoggedIn ? "/community/discussions" : "/community", label: "Discussions", icon: Users, description: "Safe space to share stories" },
      { href: "/messages", label: "Messages", icon: MessageCircle, description: "Private conversations" },
      { href: "/community?saved=1", label: "Saved Posts", icon: Heart, description: "Posts you've bookmarked" },
    ]
  },
  {
    label: "Care Compass",
    items: [
      { href: "/providers", label: "Find Care", icon: Stethoscope, description: "NPI-verified specialists" },
      { href: "/autism-navigator", label: "Support Navigator", icon: Map, description: "Your personalized guide" },
      { href: "/screening", label: "M-CHAT-R/F™", icon: ClipboardCheck, description: "Validated autism screening" },
    ]
  },
  {
    label: "Support",
    items: [
      { href: isLoggedIn ? "/aac/app" : "/aac", label: "AAC Communicator", icon: MessageSquare, description: "Voice communication board" },
      { href: "/therapy-log", label: "Therapy Log", icon: ClipboardList, description: "Track therapy sessions" },
      { href: "/daily-wins", label: "Daily Wins", icon: Star, description: "Celebrate what worked today" },
    ]
  },
  {
    label: "Knowledge",
    items: [
      { href: "/resources", label: "Resources", icon: BookOpen, description: "Guides, tools & manuals" },
      { href: "/ai-support", label: "AI Companion", icon: Brain, description: "24/7 instant guidance" },
    ]
  },
  {
    label: "Games",
    items: [
      { href: "/games", label: "All Games", icon: Gamepad2, description: "Fun learning activities" },
      { href: "/games/memory-match", label: "Memory Match", icon: Grid3X3, description: "Find matching pairs" },
      { href: "/games/color-sort", label: "Color Sort", icon: Palette, description: "Sort by colors" },
      { href: "/games/shape-puzzle", label: "Shape Puzzle", icon: Shapes, description: "Match shapes" },
      { href: "/games/pattern-complete", label: "Patterns", icon: Puzzle, description: "Complete sequences" },
      { href: "/games/emotion-match", label: "Emotions", icon: Smile, description: "Learn feelings" },
      { href: "/games/calming-bubbles", label: "Calm Bubbles", icon: Circle, description: "Pop to relax" },
      { href: "/games/counting-stars", label: "Counting Stars", icon: Star, description: "Count objects" },
      { href: "/games/sound-match", label: "Sound Match", icon: Music, description: "Match sounds" },
      { href: "/games/sequence-builder", label: "Sequences", icon: ListOrdered, description: "Order steps" },
      { href: "/games/spot-difference", label: "Spot Difference", icon: Search, description: "Find what's different" },
    ]
  },
  {
    label: "Essentials",
    items: [
      { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, description: "Curated products & resources" },
      { href: "/emergency-card", label: "Emergency Cards", icon: CreditCard, description: "Printable info cards" },
      { href: "/calm", label: "Calm Tool", icon: Wind, description: "Breathing exercises & relaxation" },
    ]
  }
];

const USER_ITEMS: SubItem[] = [
  { href: "/about", label: "About Us", icon: Info, description: "Our mission & journey" },
  { href: "/trust", label: "Trust & Safety", icon: Shield, description: "Security & moderation" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Account preferences" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState({ unreadConnectionRequests: 0, unreadMessages: 0, totalUnread: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll detection for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (session?.user) {
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
  }, [session]);

  // Check if current page is in auth routes (should hide nav)
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (!mounted || isAuthPage) return null;

  return (
    <>
      {/* Floating Island Navbar - Premium Glass Design */}
      <nav
        className={`
          fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-50 
          w-[92%] sm:w-[90%] md:w-[85%] lg:w-[90%] max-w-7xl
          rounded-2xl border border-white/20 dark:border-white/10
          shadow-2xl backdrop-blur-xl 
          transition-all duration-500 ease-out
          ${scrolled
            ? 'bg-white/80 dark:bg-black/80 shadow-luxury-lg scale-[1.00]'
            : 'bg-white/60 dark:bg-black/60 scale-[1.01]'
          }
        `}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Premium Animation */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
                  style={{ boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)' }}>
                  <img src="/logo-icon.png" alt="NeuroKid" className="w-full h-full object-contain" />
                </div>
                {/* Glow ring on hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }} />
              </div>
              <span className="hidden text-xl font-black sm:inline bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent transition-all duration-300 group-hover:tracking-wide">
                NeuroKid
              </span>
            </Link>

            {/* Desktop Menu - Premium Styling */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className={`
                  relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300
                  ${pathname === "/"
                    ? "text-emerald-500"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                  }
                  hover:bg-[var(--surface2)]/50
                `}
              >
                Home
                {pathname === "/" && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </Link>

              {getNavGroups(!!session?.user).map((group) => {
                const isCommunityGroup = group.label === "Community";
                const hasGroupNotification = isCommunityGroup && notifications.totalUnread > 0;
                return (
                  <div key={group.label} className="relative group/nav">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-[var(--muted)] group-hover/nav:text-[var(--text)] transition-all duration-300 hover:bg-[var(--surface2)]/50 relative">
                      {group.label}
                      {hasGroupNotification && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
                          {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                        </span>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover/nav:opacity-100 transition-all duration-300 group-hover/nav:rotate-180" />
                    </button>

                    {/* Dropdown Mega Menu - Premium Glass */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 translate-y-4 scale-95 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:scale-100 group-hover/nav:pointer-events-auto transition-all duration-300 ease-out z-50">
                      <div className="w-72 rounded-2xl dropdown-premium p-3">
                        <div className="grid gap-1">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            const isMessages = item.href === "/messages";
                            const hasNotifications = isMessages && notifications.totalUnread > 0;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                  flex items-start gap-3 p-3 rounded-xl transition-all duration-300
                                  ${isActive
                                    ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                                    : "hover:bg-[var(--surface2)] hover:shadow-md"
                                  }
                                  group/item
                                `}
                              >
                                <div className={`
                                  relative mt-0.5 p-2 rounded-lg transition-all duration-300
                                  ${isActive
                                    ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg"
                                    : "bg-[var(--surface2)] text-[var(--muted)] group-hover/item:bg-gradient-to-br group-hover/item:from-emerald-500/20 group-hover/item:to-teal-500/20 group-hover/item:text-emerald-500"
                                  }
                                  group-hover/item:scale-110
                                `}>
                                  <Icon className="w-4 h-4" />
                                  {hasNotifications && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                                      {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className={`text-sm font-bold ${isActive ? "text-emerald-500" : "text-[var(--text)]"} flex items-center gap-2 group-hover/item:text-emerald-500 transition-colors`}>
                                    {item.label}
                                    {hasNotifications && (
                                      <span className="text-[10px] font-semibold text-rose-500 animate-pulse">New</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[var(--muted)] leading-snug mt-0.5">
                                    {item.description}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                          {/* Sign Out button in Platform dropdown */}
                          {/* Sign Out logic handled in User Menu now */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Section: Get Help + Theme Toggle + Auth */}
            <div className="flex items-center gap-3">
              {/* Get Help Button - Premium with Glow */}
              <Link
                href="/crisis"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 via-rose-500 to-pink-500 text-white text-[11px] font-black uppercase tracking-wider shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ boxShadow: '0 2px 10px rgba(244, 63, 94, 0.3)' }}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Help</span>
              </Link>

              {/* Theme Toggle - Premium */}
              {session && (
                <>
                  <button
                    onClick={toggleTheme}
                    className="relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 glass-premium hover:shadow-lg group overflow-hidden"
                    aria-label="Toggle theme"
                    title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {theme === "light" ? (
                      <Moon className="w-4 h-4 text-slate-600 transition-transform duration-300 group-hover:rotate-12" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
                    )}
                  </button>

                  {/* PREMIUM USER MENU */}
                  <div className="relative group/user">
                    <button className="relative flex items-center justify-center w-10 h-10 rounded-xl glass-premium hover:shadow-lg transition-all duration-300 group-hover/user:scale-105">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 opacity-0 group-hover/user:opacity-100 transition-opacity duration-300" />
                      <Users className="w-5 h-5 text-[var(--text)] transition-colors duration-300 group-hover/user:text-emerald-500" />
                      {/* Neon Glow Effect */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover/user:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    </button>

                    {/* Dropdown - User Menu */}
                    <div className="absolute right-0 top-full pt-3 opacity-0 translate-y-4 scale-95 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:scale-100 group-hover/user:pointer-events-auto transition-all duration-300 ease-out z-50">
                      <div className="w-64 rounded-2xl dropdown-premium p-3">
                        <div className="px-3 py-2 text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
                          My Account
                        </div>
                        <div className="grid gap-1">
                          {USER_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                   flex items-start gap-3 p-3 rounded-xl transition-all duration-300
                                   ${isActive
                                    ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                                    : "hover:bg-[var(--surface2)] hover:shadow-md"
                                  }
                                   group/item
                                 `}
                              >
                                <div className={`
                                   relative mt-0.5 p-2 rounded-lg transition-all duration-300
                                   ${isActive
                                    ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg"
                                    : "bg-[var(--surface2)] text-[var(--muted)] group-hover/item:bg-gradient-to-br group-hover/item:from-emerald-500/20 group-hover/item:to-teal-500/20 group-hover/item:text-emerald-500"
                                  }
                                   group-hover/item:scale-110
                                 `}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className={`text-sm font-bold ${isActive ? "text-emerald-500" : "text-[var(--text)]"} flex items-center gap-2 group-hover/item:text-emerald-500 transition-colors`}>
                                    {item.label}
                                  </div>
                                  <div className="text-[11px] text-[var(--muted)] leading-snug mt-0.5">
                                    {item.description}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}

                          <div className="my-2 border-t border-[var(--border)]"></div>
                          <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex items-start gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:shadow-md w-full text-left group/signout"
                          >
                            <div className="mt-0.5 p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 transition-all duration-300 group-hover/signout:scale-110 group-hover/signout:bg-rose-500 group-hover/signout:text-white">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                Sign Out
                              </div>
                              <div className="text-[11px] text-[var(--muted)] leading-snug mt-0.5">
                                Log out of your account
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Mobile Menu Button - Premium */}
              <button
                className="lg:hidden p-2.5 rounded-xl glass-premium hover:shadow-lg text-[var(--text)] transition-all duration-300"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu - Premium Glass Panel */}
          {mobileOpen && (
            <div className="lg:hidden absolute left-0 right-0 top-full glass-premium border-t border-[var(--border)] py-6 px-4 space-y-4 max-h-[85vh] overflow-y-auto shadow-luxury animate-slide-up">
              {/* Mobile Get Help Button */}
              <Link
                href="/crisis"
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-lg btn-glow-luxury"
                onClick={() => setMobileOpen(false)}
              >
                <Phone className="w-5 h-5" />
                <span>Get Help Now</span>
              </Link>

              <Link
                href="/"
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold transition-all duration-300
                  ${pathname === "/"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                    : "text-[var(--text)] hover:bg-[var(--surface2)]"
                  }
                `}
                onClick={() => setMobileOpen(false)}
              >
                <Sparkles className="w-5 h-5" />
                Home
              </Link>

              {getNavGroups(!!session?.user).map((group) => {
                const isCommunityGroup = group.label === "Community";
                const hasGroupNotification = isCommunityGroup && notifications.totalUnread > 0;
                return (
                  <div key={group.label} className="space-y-2">
                    <div className="px-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] opacity-60 flex items-center gap-2">
                      {group.label}
                      {hasGroupNotification && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                          {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        const isMessages = item.href === "/messages";
                        const hasNotifications = isMessages && notifications.totalUnread > 0;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`
                              flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                              ${isActive
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                                : "hover:bg-[var(--surface2)] text-[var(--text)]"
                              }
                            `}
                            onClick={() => setMobileOpen(false)}
                          >
                            <div className={`
                              relative p-2 rounded-lg transition-all duration-300
                              ${isActive
                                ? "bg-white/20"
                                : "bg-[var(--surface2)]"
                              }
                            `}>
                              <Icon className="w-5 h-5" />
                              {hasNotifications && (
                                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                                  {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                                </span>
                              )}
                            </div>
                            <span className="font-bold flex-1">{item.label}</span>
                            {hasNotifications && !isActive && (
                              <span className="text-[10px] font-semibold text-rose-500 animate-pulse">New</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Mobile Theme Toggle + Sign Out */}
              {session && (
                <div className="border-t border-[var(--border)] mt-4 pt-4 flex flex-col gap-3">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-300 glass-premium hover:shadow-lg text-[var(--text)] w-full"
                  >
                    <div className="p-2 rounded-lg bg-[var(--surface2)]">
                      {theme === "light" ? (
                        <Moon className="w-5 h-5 text-slate-600" />
                      ) : (
                        <Sun className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <span>{theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}</span>
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-300 bg-gradient-to-r from-rose-500/10 to-pink-500/10 hover:from-rose-500/20 hover:to-pink-500/20 text-rose-600 dark:text-rose-400 w-full"
                  >
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
