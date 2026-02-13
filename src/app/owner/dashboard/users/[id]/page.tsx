'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormattedDate } from '@/components/shared/FormattedDate';
import Link from 'next/link';
import { ArrowLeft, Mail, Calendar, Clock, FileText, MessageSquare, Heart, Ban, ShieldAlert } from 'lucide-react';
import { PremiumCard } from '@/components/owner/PremiumCard';
import { PremiumPageHeader, PremiumGrid } from '@/components/owner/PremiumSection';
import UserActions from './UserActions';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [riskScore, setRiskScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/owner/users/${userId}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) {
          router.push('/owner/dashboard/users');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          // Risk score would need to be calculated separately if needed
        }
      })
      .catch((err) => {
        console.error('Failed to load user:', err);
        router.push('/owner/dashboard/users');
      })
      .finally(() => setLoading(false));
  }, [userId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title={user.profile?.displayName || 'Anonymous User'}
        subtitle={`@${user.profile?.username || 'no-username'}`}
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Users', href: '/owner/dashboard/users' },
          { label: 'Details' }
        ]}
        actions={
          <Link
            href="/owner/dashboard/users"
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Users
          </Link>
        }
        gradient="from-blue-600 via-indigo-600 to-purple-600"
      />

      {user.isBanned && (
        <PremiumCard variant="gradient" className="border-rose-500/30 bg-rose-500/10">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <Ban size={24} />
            <div>
              <p className="font-bold">User is banned</p>
              {user.bannedReason && <p className="text-sm opacity-90">{user.bannedReason}</p>}
            </div>
          </div>
        </PremiumCard>
      )}

      <UserActions 
        userId={user.id} 
        isBanned={user.isBanned} 
        bannedReason={user.bannedReason}
        initialNotes={user.ownerNotes}
      />

      <PremiumGrid cols={3} className="mb-8 mt-6">
        <PremiumCard variant="glass">
          <h2 className="font-semibold text-foreground mb-4">User Info</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground">{user.email}</p>
                {user.emailVerified && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="text-foreground"><FormattedDate date={user.createdAt} style="date" /></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="text-foreground">
                  {user.lastLoginAt
                    ? <FormattedDate date={user.lastLoginAt} style="dateTime" />
                    : 'Never'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Roles</p>
              <div className="flex flex-wrap gap-1">
                {user.userRoles && user.userRoles.map((role) => (
                  <span
                    key={role.id}
                    className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400"
                  >
                    {role.role}
                  </span>
                ))}
                {(!user.userRoles || user.userRoles.length === 0) && (
                  <span className="text-muted-foreground text-sm">No roles assigned</span>
                )}
              </div>
            </div>
            {user.profile?.bio && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bio</p>
                <p className="text-foreground text-sm">{user.profile.bio}</p>
              </div>
            )}
          </div>
        </PremiumCard>

        <PremiumCard variant="glass">
          <h2 className="font-semibold text-foreground mb-4">Activity Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-border">
              <FileText className="mx-auto mb-2 text-blue-500" size={24} />
              <p className="text-2xl font-bold text-foreground">{user._count?.posts ?? 0}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-border">
              <MessageSquare className="mx-auto mb-2 text-emerald-500" size={24} />
              <p className="text-2xl font-bold text-foreground">{user._count?.comments ?? 0}</p>
              <p className="text-sm text-muted-foreground">Comments</p>
            </div>
            <div className="text-center p-4 bg-pink-500/10 rounded-lg border border-border">
              <Heart className="mx-auto mb-2 text-pink-500" size={24} />
              <p className="text-2xl font-bold text-foreground">{user._count?.votes ?? 0}</p>
              <p className="text-sm text-muted-foreground">Votes</p>
            </div>
            <div className="text-center p-4 bg-violet-500/10 rounded-lg border border-border">
              <MessageSquare className="mx-auto mb-2 text-violet-500" size={24} />
              <p className="text-2xl font-bold text-foreground">{user._count?.aiConversations ?? 0}</p>
              <p className="text-sm text-muted-foreground">AI Chats</p>
            </div>
          </div>
        </PremiumCard>

        {riskScore && (
          <PremiumCard variant="glass">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-500" />
              Risk & Safety
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground text-sm">Risk Level</p>
                <span
                  className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                    riskScore.riskLevel === 'HIGH'
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                      : riskScore.riskLevel === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {riskScore.riskLevel}
                </span>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Score</p>
                <p className="text-foreground">{(riskScore.score * 100).toFixed(0)}/100</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Last Evaluated</p>
                <p className="text-foreground"><FormattedDate date={riskScore.lastEvaluatedAt} style="date" /></p>
              </div>
              {riskScore.factors && typeof riskScore.factors === 'object' && Object.keys(riskScore.factors as object).length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Factors</p>
                  <div className="space-y-1">
                    {Object.entries(riskScore.factors as Record<string, number | string>).map(([k, v]) => (
                      <p key={k} className="text-foreground text-sm">
                        {k.replace(/_/g, ' ')}: {String(v)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PremiumCard>
        )}

        <PremiumCard variant="glass">
          <h2 className="font-semibold text-foreground mb-4">Profile Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Username</p>
              <p className="text-foreground">@{user.profile?.username || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Display Name</p>
              <p className="text-foreground">{user.profile?.displayName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="text-foreground">{user.profile?.location || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Verified Therapist</p>
              <p className="text-foreground">{user.profile?.verifiedTherapist ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Shadowbanned</p>
              <p className={user.profile?.shadowbanned ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground'}>
                {user.profile?.shadowbanned ? 'Yes' : 'No'}
              </p>
            </div>
            {user.isBanned && user.bannedReason && (
              <div>
                <p className="text-muted-foreground">Ban Reason</p>
                <p className="text-red-600 dark:text-red-400">{user.bannedReason}</p>
              </div>
            )}
          </div>
        </PremiumCard>
      </PremiumGrid>

      <PremiumGrid cols={2}>
        <PremiumCard variant="glass">
          <h2 className="font-semibold text-foreground mb-4">Recent Posts ({user._count?.posts ?? 0} total)</h2>
          {user.posts.length > 0 ? (
            <div className="space-y-3">
              {user.posts.map((post) => (
                <div key={post.id} className="border-b border-border pb-3 last:border-0">
                  <p className="font-medium text-foreground">{post.title}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="px-2 py-0.5 bg-secondary rounded">{post.category.name}</span>
                    <span><FormattedDate date={post.createdAt} style="date" /></span>
                    <span>{post.viewCount} views</span>
                    <span>{post.commentCount} comments</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No posts yet</p>
          )}
        </PremiumCard>

        <PremiumCard variant="glass">
          <h2 className="font-semibold text-foreground mb-4">Recent Comments ({user._count?.comments ?? 0} total)</h2>
          {user.comments.length > 0 ? (
            <div className="space-y-3">
              {user.comments.map((comment) => (
                <div key={comment.id} className="border-b border-border pb-3 last:border-0">
                  <p className="text-foreground text-sm line-clamp-2">{comment.content}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>On: {comment.post.title.substring(0, 30)}...</span>
                    <span><FormattedDate date={comment.createdAt} style="date" /></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No comments yet</p>
          )}
        </PremiumCard>
      </PremiumGrid>

      {user.auditLogs.length > 0 && (
        <PremiumCard variant="glass" className="mt-6">
          <h2 className="font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {user.auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-foreground">{log.action}</p>
                  {log.targetType && (
                    <p className="text-sm text-muted-foreground">
                      {log.targetType}: {log.targetId?.substring(0, 8)}...
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  <FormattedDate date={log.createdAt} style="dateTime" />
                </span>
              </div>
            ))}
          </div>
        </PremiumCard>
      )}
    </div>
  );
}
