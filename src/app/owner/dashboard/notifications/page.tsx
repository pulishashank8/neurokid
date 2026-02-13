'use client';

import { useEffect, useState, useCallback } from 'react';
import { FormattedDate } from '@/components/shared/FormattedDate';
import {
  Bell,
  Send,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Users,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  PremiumPageHeader,
  PremiumCard,
} from '@/components/owner/PremiumSection';
import { PremiumButton } from '@/components/owner/PremiumButton';

interface AdminNotification {
  id: string;
  type: string;
  severity: string;
  message: string;
  relatedEntity: string | null;
  isRead: boolean;
  createdAt: string;
}

const DEFAULT_TEMPLATES = [
  { id: 'welcome', title: 'Welcome to NeuroKid', message: 'Thanks for joining! Explore resources and connect with other parents.' },
  { id: 'inactive', title: 'We miss you', message: 'You haven\'t logged in for a while. Check out what\'s new on NeuroKid.' },
  { id: 'feature', title: 'New feature', message: 'We\'ve added new tools to support your journey. Take a look!' },
  { id: 'tip', title: 'Weekly tip', message: 'Small daily wins make a big difference. Keep going!' },
  { id: 'community', title: 'Community update', message: 'New posts and discussions are waiting for you in the community.' },
];

type Tab = 'send' | 'alerts';

type Group = 'all' | 'parents' | 'therapist' | 'providers';
type Activity = 'all' | 'inactive_7d' | 'new_today' | 'joined_7d' | 'joined_1y';

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('send');
  const [alerts, setAlerts] = useState<AdminNotification[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [group, setGroup] = useState<Group>('all');
  const [activity, setActivity] = useState<Activity>('all');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const fetchAlerts = useCallback(() => {
    setAlertsLoading(true);
    fetch('/api/owner/notifications')
      .then((r) => r.json())
      .then((d) => setAlerts(d.notifications ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false));
  }, []);

  const fetchCount = useCallback(() => {
    const params = new URLSearchParams();
    if (group !== 'all') params.set('group', group);
    if (activity !== 'all') params.set('activity', activity);
    params.set('limit', '1');
    fetch(`/api/owner/users?${params}`)
      .then((r) => r.json())
      .then((d) => setRecipientCount(d.total ?? 0))
      .catch(() => setRecipientCount(null));
  }, [group, activity]);

  useEffect(() => {
    if (tab === 'alerts') fetchAlerts();
  }, [tab, fetchAlerts]);

  useEffect(() => {
    if (tab === 'send') fetchCount();
  }, [tab, group, activity, fetchCount]);

  const markRead = async (id: string) => {
    await fetch(`/api/owner/notifications/${id}/read`, { method: 'POST' });
    setAlerts((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    const unread = alerts.filter((n) => !n.isRead).map((n) => n.id);
    await Promise.all(unread.map((id) => fetch(`/api/owner/notifications/${id}/read`, { method: 'POST' })));
    setAlerts((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const applyTemplate = (t: (typeof DEFAULT_TEMPLATES)[0]) => {
    setTitle(t.title);
    setMessage(t.message);
  };

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      setSendResult({ ok: false, message: 'Title and message are required' });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/owner/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          group: group === 'all' ? undefined : group,
          activity: activity === 'all' ? undefined : activity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendResult({ ok: false, message: data.error || 'Failed to send' });
        return;
      }
      setSendResult({ ok: true, message: `Sent to ${data.sentCount} users` });
      setTitle('');
      setMessage('');
      setLink('');
    } catch {
      setSendResult({ ok: false, message: 'Network error' });
    } finally {
      setSending(false);
    }
  };

  const severityConfig = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/20' },
    critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/20' },
  };

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="Announcements & Alerts"
        subtitle="Send announcements to users • View system alerts"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Notifications' },
        ]}
        actions={
          tab === 'alerts' && alerts.some((n) => !n.isRead) ? (
            <PremiumButton
              onClick={markAllRead}
              variant="secondary"
              size="sm"
              icon={CheckCircle2}
            >
              Mark all read
            </PremiumButton>
          ) : tab === 'alerts' ? (
            <PremiumButton
              onClick={fetchAlerts}
              variant="secondary"
              icon={RefreshCw}
              size="sm"
            >
              Refresh
            </PremiumButton>
          ) : null
        }
        gradient="from-violet-600 via-purple-600 to-pink-600"
      />

      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setTab('send')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === 'send' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Send Announcements
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            tab === 'alerts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          System Alerts
          {alerts.filter((n) => !n.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {alerts.filter((n) => !n.isRead).length}
            </span>
          )}
        </button>
      </div>

      {tab === 'send' && (
        <div className="space-y-6">
          <PremiumCard variant="glass" className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Who to send to</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Role / Group</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as Group)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="all">All users</option>
                  <option value="parents">Parents only</option>
                  <option value="therapist">Therapists only</option>
                  <option value="providers">Providers / Doctors</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Activity</label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value as Activity)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="all">All</option>
                  <option value="inactive_7d">Inactive 7+ days</option>
                  <option value="new_today">New today</option>
                  <option value="joined_7d">Joined in last 7 days</option>
                  <option value="joined_1y">Joined 1+ year ago</option>
                </select>
              </div>
            </div>
            {recipientCount !== null && (
              <p className="text-muted-foreground text-sm mt-2">
                <Users className="w-4 h-4 inline mr-1" />
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} will receive this announcement
              </p>
            )}
          </PremiumCard>

          <PremiumCard variant="glass" className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEFAULT_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className="text-left p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-colors"
                >
                  <p className="font-medium text-foreground truncate">{t.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{t.message}</p>
                  <span className="text-xs text-primary mt-2 inline-flex items-center gap-1">
                    Use template <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard variant="glass" className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Compose announcement</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New feature launched"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What would you like to announce to users?"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Link (optional) – Where should users go when they click?
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. /resources or https://..."
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {sendResult && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    sendResult.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {sendResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {sendResult.message}
                </div>
              )}
              <PremiumButton
                onClick={sendNotification}
                disabled={sending || !title.trim() || !message.trim() || (recipientCount !== null && recipientCount === 0)}
                variant="primary"
                icon={Send}
                loading={sending}
                className="px-6 py-3"
              >
                {sending ? 'Sending...' : `Send announcement to ${recipientCount ?? '...'} users`}
              </PremiumButton>
            </div>
          </PremiumCard>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length > 0 && alerts.some((n) => !n.isRead) && (
            <button
              onClick={markAllRead}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Mark all as read
            </button>
          )}
          {alertsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Bell className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-foreground font-medium">No system alerts</p>
              <p className="text-muted-foreground text-sm mt-1">
                System errors and important events will appear here
              </p>
            </div>
          ) : (
            alerts.map((n) => {
              const cfg = severityConfig[n.severity as keyof typeof severityConfig] || severityConfig.info;
              return (
                <div
                  key={n.id}
                  className={`bg-card rounded-2xl border border-border p-6 flex items-start gap-4 shadow-sm ${
                    !n.isRead ? 'border-amber-500/30' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <cfg.icon size={20} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          n.severity === 'critical'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                            : n.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {n.severity}
                      </span>
                      <span className="text-muted-foreground text-xs">{n.type}</span>
                    </div>
                    <p className="text-foreground font-medium mt-2 break-words">{n.message}</p>
                    {n.relatedEntity && (
                      <p className="text-muted-foreground text-sm mt-1">{n.relatedEntity}</p>
                    )}
                    <p className="text-muted-foreground text-xs mt-2">
                      <FormattedDate date={n.createdAt} style="dateTime" />
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm hover:bg-emerald-500/30 font-medium"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
