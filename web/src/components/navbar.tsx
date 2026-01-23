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
  Sparkles,
  Heart
} from "lucide-react";

type SubItem = { href: string; label: string; icon: any; description: string };
type NavGroup = { label: string; items: SubItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Community",
    items: [
      { href: "/community", label: "Forums", icon: Users, description: "Safe space to share stories" },
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
    label: "Knowledge",
    items: [
      { href: "/resources", label: "Resources", icon: BookOpen, description: "Guides, tools & manuals" },
      { href: "/ai-support", label: "AI Companion", icon: Brain, description: "24/7 instant guidance" },
    ]
  },
  {
    label: "Platform",
    items: [
      { href: "/about", label: "About Us", icon: Info, description: "Our mission & journey" },
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-bold">
                NK
              </div>
              <span className="hidden text-lg font-semibold sm:inline">
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

              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="relative group/nav">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-[var(--muted)] group-hover/nav:text-[var(--text)] transition-colors">
                    {group.label}
                    <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover/nav:opacity-100 transition-all group-hover/nav:rotate-180" />
                  </button>

                  {/* Dropdown Mega Menu */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-200 z-50">
                    <div className="w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl">
                      <div className="grid gap-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${isActive
                                ? "bg-[var(--primary)]/10"
                                : "hover:bg-[var(--surface2)]"
                                }`}
                            >
                              <div className={`mt-0.5 p-1.5 rounded-lg ${isActive ? "bg-[var(--primary)] text-white" : "bg-[var(--surface2)] text-[var(--muted)]"}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className={`text-sm font-bold ${isActive ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>
                                  {item.label}
                                </div>
                                <div className="text-[10px] text-[var(--muted)] leading-tight mt-0.5">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Section: Theme Toggle + Auth */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle - Show only when logged in */}
              {session && (
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors bg-transparent hover:bg-[var(--surface2)] text-[var(--text)]"
                  aria-label="Toggle theme"
                  title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                  {theme === "light" ? (
                    // Moon SVG
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  ) : (
                    // Sun SVG
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm0 10a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM4.293 4.293a1 1 0 011.414 0L6.414 5.414a1 1 0 00-1.414-1.414L4.293 4.293zm11.414 0a1 1 0 011.414 1.414L16.414 6.414a1 1 0 11-1.414-1.414l1.414-1.414zM4 10a1 1 0 100-2 1 1 0 000 2zm12 0a1 1 0 100-2 1 1 0 000 2zM4.293 15.707a1 1 0 00-1.414 1.414L4.586 17a1 1 0 001.414-1.414l-1.707-1.293zm11.414 0a1 1 0 001.414 1.414l1.414-1.414a1 1 0 10-1.414-1.414l-1.414 1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}

              {/* Sign Out - Show only when logged in */}
              {session && (
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                  title="Sign out"
                >
                  {/* Exit/Sign Out SVG */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm12 12H3V4h12v12zm1-12a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
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
              <Link
                href="/"
                className={`block px-4 py-2 rounded-xl text-base font-bold transition-colors ${pathname === "/" ? "bg-[var(--primary)] text-white" : "text-[var(--text)]"}`}
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>

              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <div className="px-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] opacity-50">
                    {group.label}
                  </div>
                  <div className="grid gap-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--surface2)] text-[var(--text)]"}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-bold">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Mobile Theme Toggle + Sign Out */}
              {session && (
                <div className="border-t border-[var(--border)] mt-2 pt-2 flex flex-col gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)] w-full"
                  >
                    {theme === "light" ? (
                      <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm0 10a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM4.293 4.293a1 1 0 011.414 0L6.414 5.414a1 1 0 00-1.414-1.414L4.293 4.293zm11.414 0a1 1 0 011.414 1.414L16.414 6.414a1 1 0 11-1.414-1.414l1.414-1.414zM4 10a1 1 0 100-2 1 1 0 000 2zm12 0a1 1 0 100-2 1 1 0 000 2zM4.293 15.707a1 1 0 00-1.414 1.414L4.586 17a1 1 0 001.414-1.414l-1.707-1.293zm11.414 0a1 1 0 001.414 1.414l1.414-1.414a1 1 0 10-1.414-1.414l-1.414 1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 w-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
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
