'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, Wifi, WifiOff } from 'lucide-react';
import { FormattedDate } from '@/components/shared/FormattedDate';

interface OnlineStats {
  onlineCount: number;
  onlineSessions: {
    id: string;
    lastActiveAt: string;
    userAgent: string | null;
    ipAddress: string | null;
    user: {
      id: string;
      email: string;
      profile: { username: string; displayName: string } | null;
    };
  }[];
  recentLogins: {
    id: string;
    email: string;
    lastLoginAt: string | null;
    profile: { username: string; displayName: string } | null;
  }[];
  recentLoginsTodayCount?: number;
}

export default function OnlineUsersPage() {
  const [stats, setStats] = useState<OnlineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOnlineStats();
    const interval = setInterval(fetchOnlineStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOnlineStats() {
    try {
      const res = await fetch('/api/owner/stats?type=online');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/owner/login';
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await res.json();
      if (data.onlineCount !== undefined) {
        setStats(data);
      } else {
        setStats({ onlineCount: 0, onlineSessions: [], recentLogins: [] });
      }
    } catch (error) {
      console.error('Error fetching online stats:', error);
      setError('Failed to load online user data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <WifiOff size={48} className="mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Live Operations</h1>
        <p className="text-muted-foreground">Real-time view of active users (refreshes every 30 seconds)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Wifi className="text-emerald-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Currently Online</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{stats?.onlineCount ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Clock className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Recent Logins Today</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {stats?.recentLoginsTodayCount ?? stats?.recentLogins?.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Wifi className="text-emerald-500" size={20} />
            <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
          </div>

          {stats?.onlineSessions && stats.onlineSessions.length > 0 ? (
            <div className="space-y-3">
              {stats.onlineSessions.map((session) => (
                <div key={session.id} className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-foreground">
                        {session.user.profile?.displayName || session.user.email}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <FormattedDate date={session.lastActiveAt} relative />
                    </span>
                  </div>
                  {session.user.profile?.username && (
                    <p className="text-sm text-muted-foreground">@{session.user.profile.username}</p>
                  )}
                  {session.ipAddress && (
                    <p className="text-xs text-muted-foreground mt-1">IP: {session.ipAddress}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <WifiOff size={48} className="mx-auto mb-2 opacity-50" />
              <p>No active sessions</p>
              <p className="text-sm mt-1">Sessions are tracked when authenticated users have the app open (heartbeat every 60s). You’ll appear here when viewing this page.</p>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-blue-500" size={20} />
            <h2 className="text-lg font-semibold text-foreground">Recent Logins</h2>
          </div>

          {stats?.recentLogins && stats.recentLogins.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.recentLogins.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">
                      {user.profile?.displayName || user.email}
                    </p>
                    {user.profile?.username && (
                      <p className="text-sm text-muted-foreground">@{user.profile.username}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {user.lastLoginAt ? <FormattedDate date={user.lastLoginAt} style="dateTimeShort" /> : 'Never'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users size={48} className="mx-auto mb-2 opacity-50" />
              <p>No recent logins</p>
              <p className="text-sm mt-1">Login timestamps are recorded when users sign in via NextAuth.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
