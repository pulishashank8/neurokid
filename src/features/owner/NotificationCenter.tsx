'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronDown } from 'lucide-react';
import { FormattedDate } from '@/components/shared/FormattedDate';

interface Notification {
  id: string;
  type: string;
  severity: string;
  message: string;
  relatedEntity?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = () => {
      fetch('/api/owner/notifications')
        .then((r) => r.json())
        .then((data) => {
          const list = data.notifications ?? data ?? [];
          setNotifications(Array.isArray(list) ? list.slice(0, 20) : []);
          setUnreadCount(list.filter((n: Notification) => !n.isRead).length);
        })
        .catch(() => {});
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 min-w-[44px] min-h-[44px] rounded-xl backdrop-blur-xl border border-border bg-surface/90 text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors touch-manipulation"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 bottom-full mb-2 w-[min(384px,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto bg-popover border border-border rounded-xl shadow-xl z-50">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-foreground">Notifications</h3>
              <Link
                href="/owner/dashboard/notifications"
                className="text-sm text-emerald-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="p-4 text-muted-foreground text-sm">No notifications</div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 ${!n.isRead ? 'bg-accent/50' : ''}`}
                  >
                    <p className="text-foreground text-sm">{n.message}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      <FormattedDate date={n.createdAt} relative />
                      {n.severity === 'critical' && (
                        <span className="ml-2 text-red-400">Critical</span>
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
