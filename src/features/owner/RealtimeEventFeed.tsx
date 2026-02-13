'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, UserPlus, FileText, MessageSquare, Cpu, Flag, Shield } from 'lucide-react';
import { FormattedDate } from '@/components/shared/FormattedDate';

interface EventItem {
  id?: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
}

const iconMap: Record<string, typeof Activity> = {
  login: UserPlus,
  signup: UserPlus,
  post_create: FileText,
  comment_create: MessageSquare,
  message_send: MessageSquare,
  ai_request: Cpu,
  ai_chat: Cpu,
  ai_use: Cpu,
  page_view: Activity,
  screening_complete: FileText,
  report_submitted: Flag,
  admin_action: Shield,
  default: Activity,
};

const labelMap: Record<string, string> = {
  login: 'User login',
  signup: 'New signup',
  post_create: 'Post created',
  comment_create: 'Comment created',
  message_send: 'Message sent',
  ai_request: 'AI request',
  ai_chat: 'AI chat',
  ai_use: 'AI usage',
  page_view: 'Page view',
  screening_complete: 'Screening completed',
  report_submitted: 'Report submitted',
  admin_action: 'Admin action',
};

export default function RealtimeEventFeed({ limit = 20 }: { limit?: number }) {
  const [events, setEvents] = useState<EventItem[]>([]);

  const loadEvents = useCallback(() => {
    fetch(`/api/owner/events?limit=${limit}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((body) => {
        const list = body?.events ?? [];
        setEvents(list.slice(0, limit).map((x: EventItem) => ({
          eventType: x.eventType,
          entityType: x.entityType,
          entityId: x.entityId,
          createdAt: x.createdAt,
        })));
      })
      .catch(() => {});
  }, [limit]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // SSE for live updates
  useEffect(() => {
    const es = new EventSource('/api/owner/events/stream');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'init' && data.events?.length > 0) {
          setEvents(
            data.events.slice(0, limit).map((x: EventItem) => ({
              eventType: x.eventType,
              entityType: x.entityType,
              entityId: x.entityId,
              createdAt: x.createdAt,
            }))
          );
        } else if (data.type === 'event') {
          setEvents((prev) => [
            {
              eventType: data.eventType,
              entityType: data.entityType,
              entityId: data.entityId,
              createdAt: data.createdAt,
            },
            ...prev.slice(0, limit - 1),
          ]);
        }
      } catch {
        // ignore parse errors
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [limit]);

  return (
    <div className="bg-card backdrop-blur-xl rounded-2xl border border-border transition-colors duration-500 ease-out p-6">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Activity size={20} className="text-primary animate-pulse" />
        Live Activity
      </h2>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {events.length === 0 ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              No recent activity yet. Events appear when users sign in, create posts, or use features.
            </p>
            <button
              onClick={loadEvents}
              className="text-sm text-primary hover:underline"
            >
              Refresh
            </button>
          </div>
        ) : (
          events.map((e, i) => {
            const Icon = iconMap[e.eventType] ?? iconMap.default;
            return (
              <div
                key={`${e.eventType}-${e.createdAt}-${i}`}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30"
              >
                <Icon size={16} className="text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm">
                    {e.entityType && e.entityType !== e.eventType
                      ? `${labelMap[e.eventType] ?? e.eventType}: ${e.entityType}`
                      : (labelMap[e.eventType] ?? e.eventType)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    <FormattedDate date={e.createdAt} relative />
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
