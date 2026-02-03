"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/app/theme-provider";
import { motion, AnimatePresence } from "framer-motion";

import {
  ChevronDown,
  Users,
  Stethoscope,
  Brain,
  ClipboardCheck,
  BookOpen,
  Settings,
  Menu,
  X,
  Heart,
  Phone,
  LogOut,
  Sun,
  Moon,
  MessageCircle,
  Star,
  Gamepad2,
  Home,
  Sparkles,
  Map,
} from "lucide-react";

type SubItem = { href: string; label: string; icon: any; description: string };
type NavGroup = { label: string; items: SubItem[]; color: string };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Community",
    color: "#F87171",
    items: [
      { href: "/community", label: "Forums", icon: Users, description: "Safe space to share stories" },
      { href: "/messages", label: "Messages", icon: MessageCircle, description: "Private conversations" },
    ]
  },
  {
    label: "Care",
    color: "#38BDF8",
    items: [
      { href: "/providers", label: "Find Care", icon: Stethoscope, description: "NPI-verified specialists" },
      { href: "/autism-navigator", label: "Navigator", icon: Map, description: "Your personalized guide" },
      { href: "/screening", label: "Screening", icon: ClipboardCheck, description: "Validated autism screening" },
    ]
  },
  {
    label: "Tools",
    color: "#A78BFA",
    items: [
      { href: "/aac", label: "AAC Voice", icon: MessageCircle, description: "Communication board" },
      { href: "/daily-wins", label: "Daily Wins", icon: Star, description: "Celebrate progress" },
    ]
  },
  {
    label: "Learn",
    color: "#34D399",
    items: [
      { href: "/resources", label: "Resources", icon: BookOpen, description: "Guides & manuals" },
      { href: "/ai-support", label: "AI Companion", icon: Brain, description: "24/7 instant guidance" },
    ]
  },
  {
    label: "Play",
    color: "#F472B6",
    items: [
      { href: "/games", label: "Games", icon: Gamepad2, description: "Fun learning activities" },
    ]
  },
];

const USER_ITEMS: SubItem[] = [
  { href: "/about", label: "About", icon: Sparkles, description: "Our mission" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Preferences" },
];

export default function PremiumNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({ totalUnread: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (!mounted || isAuthPage) return null;

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
        className={`
          fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 
          w-[95%] sm:w-[92%] max-w-6xl
          rounded-2xl sm:rounded-3xl
          transition-all duration-500 ease-out
          ${scrolled
            ? 'bg-white/90 dark:bg-[#1C1917]/90 shadow-2xl backdrop-blur-xl'
            : 'bg-white/70 dark:bg-[#1C1917]/70 backdrop-blur-lg'
          }
          border border-[#E5E7EB]/50 dark:border-white/10
        `}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EC4899] 
                                flex items-center justify-center shadow-lg 
                                group-hover:shadow-[#F59E0B]/40 transition-all duration-300">
                  <Heart className="w-5 h-5 text-white" fill="white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-[#34D399] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <span className="hidden sm:inline text-xl font-black text-[#1F2937] dark:text-white">
                NeuroKid
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1">
              <Link href="/">
                <motion.span
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300
                    flex items-center gap-2
                    ${pathname === "/"
                      ? "text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#F59E0B]/20"
                      : "text-[#6B7280] hover:text-[#1F2937] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-white/10"
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Home className="w-4 h-4" />
                  Home
                </motion.span>
              </Link>

              {NAV_GROUPS.map((group) => {
                const isActive = group.items.some(item => pathname === item.href);
                const hasNotification = group.label === "Community" && notifications.totalUnread > 0;
                
                return (
                  <div 
                    key={group.label} 
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(group.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <motion.button 
                      className={`
                        flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold 
                        transition-all duration-300 relative
                        ${isActive
                          ? "text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#F59E0B]/20"
                          : "text-[#6B7280] hover:text-[#1F2937] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-white/10"
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {group.label}
                      {hasNotification && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full 
                                         bg-gradient-to-r from-rose-500 to-pink-500 text-white 
                                         text-[9px] font-bold flex items-center justify-center">
                          {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                        </span>
                      )}
                      <motion.span
                        animate={{ rotate: activeDropdown === group.label ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      </motion.span>
                    </motion.button>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {activeDropdown === group.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50"
                        >
                          <div className="w-64 rounded-2xl bg-white dark:bg-[#1C1917] shadow-2xl 
                                          border border-[#E5E7EB] dark:border-white/10 p-2">
                            <div className="grid gap-1">
                              {group.items.map((item, index) => {
                                const Icon = item.icon;
                                const isItemActive = pathname === item.href;
                                
                                return (
                                  <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <Link
                                      href={item.href}
                                      className={`
                                        flex items-start gap-3 p-3 rounded-xl transition-all duration-200
                                        ${isItemActive
                                          ? "bg-[#FEF3C7] dark:bg-[#F59E0B]/20"
                                          : "hover:bg-[#F3F4F6] dark:hover:bg-white/5"
                                        }
                                      `}
                                    >
                                      <div 
                                        className="p-2 rounded-lg"
                                        style={{ 
                                          background: isItemActive ? group.color : `${group.color}20`,
                                          color: isItemActive ? 'white' : group.color
                                        }}
                                      >
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className={`text-sm font-bold ${isItemActive ? "text-[#F59E0B]" : "text-[#1F2937] dark:text-white"}`}>
                                          {item.label}
                                        </div>
                                        <div className="text-[11px] text-[#9CA3AF] leading-snug mt-0.5">
                                          {item.description}
                                        </div>
                                      </div>
                                    </Link>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Help Button */}
              <Link href="/crisis" className="hidden sm:block">
                <motion.span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl 
                             bg-gradient-to-r from-rose-500 to-pink-500 text-white 
                             text-xs font-bold shadow-md"
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(244, 63, 94, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Help</span>
                </motion.span>
              </Link>

              {session && (
                <>
                  {/* Theme Toggle */}
                  <motion.button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl bg-[#F3F4F6] dark:bg-white/10 
                               text-[#6B7280] dark:text-[#9CA3AF]
                               hover:bg-[#E5E7EB] dark:hover:bg-white/20 
                               transition-all duration-200"
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Toggle theme"
                  >
                    {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </motion.button>

                  {/* User Menu */}
                  <div 
                    className="relative"
                    onMouseEnter={() => setActiveDropdown("user")}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <motion.button 
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl 
                                 bg-[#F3F4F6] dark:bg-white/10 
                                 hover:bg-[#E5E7EB] dark:hover:bg-white/20 
                                 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#EC4899] 
                                      flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF]" />
                    </motion.button>

                    {/* User Dropdown */}
                    <AnimatePresence>
                      {activeDropdown === "user" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute right-0 top-full pt-2 z-50"
                        >
                          <div className="w-56 rounded-2xl bg-white dark:bg-[#1C1917] shadow-2xl 
                                          border border-[#E5E7EB] dark:border-white/10 p-2">
                            <div className="px-3 py-2 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
                              My Account
                            </div>
                            <div className="grid gap-1">
                              {USER_ITEMS.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                  <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <Link
                                      href={item.href}
                                      className={`
                                        flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200
                                        ${isActive
                                          ? "bg-[#FEF3C7] dark:bg-[#F59E0B]/20"
                                          : "hover:bg-[#F3F4F6] dark:hover:bg-white/5"
                                        }
                                      `}
                                    >
                                      <div className={`
                                        p-2 rounded-lg
                                        ${isActive
                                          ? "bg-gradient-to-br from-[#F59E0B] to-[#EC4899] text-white"
                                          : "bg-[#F3F4F6] dark:bg-white/10 text-[#6B7280] dark:text-[#9CA3AF]"
                                        }
                                      `}>
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <span className={`text-sm font-bold ${isActive ? "text-[#F59E0B]" : "text-[#1F2937] dark:text-white"}`}>
                                        {item.label}
                                      </span>
                                    </Link>
                                  </motion.div>
                                );
                              })}

                              <div className="my-1 border-t border-[#E5E7EB] dark:border-white/10"></div>
                              
                              <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200
                                           hover:bg-rose-50 dark:hover:bg-rose-900/20 w-full text-left"
                              >
                                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600">
                                  <LogOut className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-rose-600">Sign Out</span>
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                className="lg:hidden p-2.5 rounded-xl bg-[#F3F4F6] dark:bg-white/10 
                           text-[#6B7280] dark:text-[#9CA3AF] transition-all duration-200"
                onClick={() => setMobileOpen(!mobileOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
            className="lg:hidden fixed top-24 left-4 right-4 z-50 
                       bg-white dark:bg-[#1C1917] rounded-3xl shadow-2xl 
                       border border-[#E5E7EB] dark:border-white/10 
                       py-4 px-3 max-h-[80vh] overflow-y-auto"
          >
            {/* Help Button */}
            <Link
              href="/crisis"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                         bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-md mb-3"
              onClick={() => setMobileOpen(false)}
            >
              <Phone className="w-5 h-5" />
              <span>Get Help Now</span>
            </Link>

            <Link
              href="/"
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 mb-1
                ${pathname === "/"
                  ? "bg-gradient-to-r from-[#F59E0B] to-[#EC4899] text-white shadow-md"
                  : "text-[#1F2937] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-white/5"
                }
              `}
              onClick={() => setMobileOpen(false)}
            >
              <Home className="w-5 h-5" />
              Home
            </Link>

            {NAV_GROUPS.map((group, groupIndex) => (
              <motion.div 
                key={group.label} 
                className="space-y-1 mt-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.05 }}
              >
                <div className="px-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF] 
                                flex items-center gap-2">
                  {group.label}
                  {group.label === "Community" && notifications.totalUnread > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] 
                                     font-bold flex items-center justify-center">
                      {notifications.totalUnread > 9 ? "9+" : notifications.totalUnread}
                    </span>
                  )}
                </div>
                <div className="grid gap-1">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (groupIndex * 0.05) + (itemIndex * 0.03) }}
                      >
                        <Link
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive
                              ? "bg-gradient-to-r from-[#F59E0B] to-[#EC4899] text-white shadow-md"
                              : "text-[#1F2937] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-white/5"
                            }
                          `}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-bold">{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {session && (
              <div className="border-t border-[#E5E7EB] dark:border-white/10 mt-3 pt-3 space-y-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold 
                             text-[#1F2937] dark:text-white w-full
                             hover:bg-[#F3F4F6] dark:hover:bg-white/5"
                >
                  {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold 
                             text-rose-600 w-full hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
