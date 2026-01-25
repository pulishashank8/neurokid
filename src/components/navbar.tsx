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
  Search
} from "lucide-react";

type SubItem = { href: string; label: string; icon: any; description: string };
type NavGroup = { label: string; items: SubItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Community",
    items: [
      { href: "/community", label: "Forums", icon: Users, description: "Safe space to share stories" },
      { href: "/messages", label: "Messages", icon: MessageCircle, description: "Private conversations" },
      { href: "/community?saved=1", label: "Saved Posts", icon: Heart, description: "Posts you've bookmarked" },
    ]
  },
  {
    label: "Care Compass",
    items: [
      { href: "/providers", label: "Find Care", icon: Stethoscope, description: "NPI-verified specialists" },
      { href: "/screening", label: "M-CHAT-R/F™", icon: ClipboardCheck, description: "Validated autism screening" },
    ]
  },
  {
    label: "Support",
    items: [
      { href: "/calm", label: "Calm Tool", icon: Wind, description: "Breathing exercises & relaxation" },
      { href: "/crisis", label: "Crisis Help", icon: Phone, description: "Emergency resources & hotlines" },
      { href: "/therapy-log", label: "Therapy Log", icon: ClipboardList, description: "Track therapy sessions" },
      { href: "/daily-wins", label: "Daily Wins", icon: Star, description: "Celebrate what worked today" },
      { href: "/emergency-card", label: "Emergency Cards", icon: CreditCard, description: "Printable info cards" },
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
    label: "Platform",
    items: [
      { href: "/about", label: "About Us", icon: Info, description: "Our mission & journey" },
      { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, description: "Curated products & resources" },
      { href: "/trust", label: "Trust & Safety", icon: Shield, description: "Security & moderation" },
      { href: "/settings", label: "Settings", icon: Settings, description: "Account preferences" },
    ]
  }
];

export default function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState({ unreadConnectionRequests: 0, unreadMessages: 0, totalUnread: 0 });

  useEffect(() => {
    setMounted(true);
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
      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-40 border-b bg-[var(--surface)] text-[var(--text)] shadow-sm border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20">
                <img src="/logo-icon.png" alt="NeuroKid" className="w-full h-full object-contain" />
              </div>
              <span className="hidden text-lg font-bold sm:inline bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                NeuroKid
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${pathname === "/"
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
              >
                Home
              </Link>

              {NAV_GROUPS.map((group) => {
                const isCommunityGroup = group.label === "Community";
                const hasGroupNotification = isCommunityGroup && notifications.totalUnread > 0;
                return (
                <div key={group.label} className="relative group/nav">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-[var(--muted)] group-hover/nav:text-[var(--text)] transition-colors relative">
                    {group.label}
                    {hasGroupNotification && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover/nav:opacity-100 transition-all group-hover/nav:rotate-180" />
                  </button>

                  {/* Dropdown Mega Menu */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-200 z-50">
                    <div className="w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl">
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
                              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${isActive
                                ? "bg-[var(--primary)]/10"
                                : "hover:bg-[var(--surface2)]"
                                }`}
                            >
                              <div className={`relative mt-0.5 p-1.5 rounded-lg ${isActive ? "bg-[var(--primary)] text-white" : "bg-[var(--surface2)] text-[var(--muted)]"}`}>
                                <Icon className="w-4 h-4" />
                                {hasNotifications && (
                                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className={`text-sm font-bold ${isActive ? "text-[var(--primary)]" : "text-[var(--text)]"} flex items-center gap-2`}>
                                  {item.label}
                                  {hasNotifications && (
                                    <span className="text-[10px] font-medium text-rose-500">New</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[var(--muted)] leading-tight mt-0.5">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                        {/* Sign Out button in Platform dropdown */}
                        {group.label === "Platform" && session && (
                          <>
                            <div className="my-1 border-t border-[var(--border)]"></div>
                            <button
                              onClick={() => signOut({ callbackUrl: "/login" })}
                              className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-rose-50 dark:hover:bg-rose-950/20 w-full text-left"
                            >
                              <div className="mt-0.5 p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                <LogOut className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                  Sign Out
                                </div>
                                <div className="text-[10px] text-[var(--muted)] leading-tight mt-0.5">
                                  Log out of your account
                                </div>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            {/* Right Section: Get Help + Theme Toggle + Auth */}
            <div className="flex items-center gap-3">
              {/* Get Help Button - High visibility with black text on red */}
              <Link
                href="/crisis"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500 text-sm font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:bg-rose-600 transition-all border-2 border-rose-600"
                style={{ color: '#000000' }}
              >
                <Phone className="w-3.5 h-3.5" style={{ color: '#000000' }} />
                <span style={{ color: '#000000' }}>Get Help</span>
              </Link>

              {/* Theme Toggle - Clear icons with labels */}
              {session && (
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors bg-[var(--surface2)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
                  aria-label="Toggle theme"
                  title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="w-4 h-4 text-slate-600" />
                      <span className="hidden xl:inline text-xs font-medium">Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span className="hidden xl:inline text-xs font-medium">Light</span>
                    </>
                  )}
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 rounded-md hover:bg-[var(--surface2)] text-[var(--text)]"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="lg:hidden border-t border-[var(--border)] bg-[var(--surface)] py-4 px-2 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Mobile Get Help Button - High visibility with black text on red */}
              <Link
                href="/crisis"
                className="flex items-center justify-center gap-2 mx-2 px-4 py-3 rounded-xl bg-rose-500 font-bold shadow-lg shadow-rose-500/30 border-2 border-rose-600"
                onClick={() => setMobileOpen(false)}
                style={{ color: '#000000' }}
              >
                <Phone className="w-5 h-5" style={{ color: '#000000' }} />
                <span style={{ color: '#000000' }}>Get Help Now</span>
              </Link>

              <Link
                href="/"
                className={`block px-4 py-2 rounded-xl text-base font-bold transition-colors ${pathname === "/" ? "bg-[var(--primary)] text-white" : "text-[var(--text)]"}`}
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>

              {NAV_GROUPS.map((group) => {
                const isCommunityGroup = group.label === "Community";
                const hasGroupNotification = isCommunityGroup && notifications.totalUnread > 0;
                return (
                <div key={group.label} className="space-y-2">
                  <div className="px-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] opacity-50 flex items-center gap-2">
                    {group.label}
                    {hasGroupNotification && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
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
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--surface2)] text-[var(--text)]"}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <div className="relative">
                            <Icon className="w-5 h-5" />
                            {hasNotifications && (
                              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                                {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                              </span>
                            )}
                          </div>
                          <span className="font-bold flex-1">{item.label}</span>
                          {hasNotifications && (
                            <span className="text-[10px] font-medium text-rose-500 dark:text-rose-400">New</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )})}

              {/* Mobile Theme Toggle + Sign Out */}
              {session && (
                <div className="border-t border-[var(--border)] mt-2 pt-4 flex flex-col gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors bg-[var(--surface2)] hover:bg-[var(--surface)] text-[var(--text)] w-full"
                  >
                    {theme === "light" ? (
                      <Moon className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-400" />
                    )}
                    <span>{theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}</span>
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors text-rose-600 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 w-full"
                  >
                    <LogOut className="w-5 h-5" />
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
