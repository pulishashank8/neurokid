"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";

type InAppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsData = {
  inAppNotifications?: InAppNotification[];
  inAppUnread?: number;
  totalUnread?: number;
};

export function UserNotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const prevUnreadRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const next = await res.json();
        const prevUnread = prevUnreadRef.current;
        const newUnread = next.inAppUnread ?? 0;
        if (prevUnread !== null && newUnread > prevUnread && newUnread > 0) {
          const newest = (next.inAppNotifications ?? []).find((n: InAppNotification) => !n.readAt);
          toast(
            (t) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--text)]">
                  {newest?.title ?? "New announcement"}
                </span>
                {newest?.message && (
                  <span className="text-sm text-[var(--muted)] line-clamp-2">{newest.message}</span>
                )}
              </div>
            ),
            { duration: 5000 }
          );
        }
        prevUnreadRef.current = newUnread;
        setData(next);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        setData((prev) => {
          if (!prev?.inAppNotifications) return prev;
          return {
            ...prev,
            inAppNotifications: prev.inAppNotifications.map((n) =>
              n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ),
            inAppUnread: Math.max(0, (prev.inAppUnread ?? 0) - 1),
          };
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const inApp = data?.inAppNotifications ?? [];
  const unread = data?.inAppUnread ?? 0;

  const markAllAsRead = async () => {
    if (loading || unread === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setData((prev) => {
          if (!prev?.inAppNotifications) return prev;
          return {
            ...prev,
            inAppNotifications: prev.inAppNotifications.map((n) => ({
              ...n,
              readAt: n.readAt ?? new Date().toISOString(),
            })),
            inAppUnread: 0,
          };
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl glass-premium hover:shadow-lg transition-all duration-300 group/btn"
        aria-label={unread ? `Announcements (${unread} unread)` : "Announcements"}
      >
        <Bell className="w-5 h-5 text-[var(--text)] transition-colors group-hover/btn:text-emerald-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-3 z-50">
          <div className="w-80 sm:w-96 rounded-2xl dropdown-premium p-3 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[var(--text)]">Announcements</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <>
                    <span className="text-xs font-semibold text-emerald-500">{unread} unread</span>
                    <button
                      onClick={markAllAsRead}
                      disabled={loading}
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                    >
                      Mark all read
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {inApp.length === 0 ? (
                <div className="py-6 text-center text-sm text-[var(--muted)]">
                  No announcements yet
                </div>
              ) : (
                inApp.map((n) => {
                  const isUnread = !n.readAt;
                  const content = (
                    <div
                      className={`
                        p-3 rounded-xl transition-all cursor-pointer
                        ${isUnread ? "bg-emerald-500/10 dark:bg-emerald-500/5" : "hover:bg-[var(--surface2)]"}
                      `}
                    >
                      <div className="font-semibold text-sm text-[var(--text)]">{n.title}</div>
                      {n.message && (
                        <div className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">
                          {n.message}
                        </div>
                      )}
                      <div className="text-[10px] text-[var(--muted)] mt-1">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                  const handleClick = () => {
                    if (isUnread) markAsRead(n.id);
                    setOpen(false);
                  };
                  if (n.link) {
                    return (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={handleClick}
                        className="block"
                      >
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={handleClick}
                      className="w-full text-left block"
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
