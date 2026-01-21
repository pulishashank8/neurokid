"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/app/theme-provider";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/community", label: "Community" },
  { href: "/providers", label: "Healthcare Providers" },
  { href: "/ai-support", label: "AI Support" },
  { href: "/screening", label: "Screening" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
  { href: "/trust", label: "Trust & Safety" },
  { href: "/settings", label: "Settings" },
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
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href
                      ? "bg-[var(--surface2)] text-[var(--primary)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                    }`}
                >
                  {item.label}
                </Link>
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
                className="md:hidden p-2 rounded-md hover:bg-[var(--surface2)] text-[var(--text)]"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] py-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === item.href
                      ? "bg-[var(--surface2)] text-[var(--primary)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                    }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile Theme Toggle + Sign Out */}
              {session && (
                <div className="border-t border-[var(--border)] mt-2 pt-2 flex flex-col gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)] w-full"
                  >
                    {theme === "light" ? (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm0 10a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM4.293 4.293a1 1 0 011.414 0L6.414 5.414a1 1 0 00-1.414-1.414L4.293 4.293zm11.414 0a1 1 0 011.414 1.414L16.414 6.414a1 1 0 11-1.414-1.414l1.414-1.414zM4 10a1 1 0 100-2 1 1 0 000 2zm12 0a1 1 0 100-2 1 1 0 000 2zM4.293 15.707a1 1 0 00-1.414 1.414L4.586 17a1 1 0 001.414-1.414l-1.707-1.293zm11.414 0a1 1 0 001.414 1.414l1.414-1.414a1 1 0 10-1.414-1.414l-1.414 1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] w-full"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm12 12H3V4h12v12zm1-12a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 012 0z" clipRule="evenodd" />
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
