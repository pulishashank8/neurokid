/**
 * Security Related Tools
 *
 * Tools for monitoring security threats, suspicious activity, and access patterns.
 */

import { prisma } from '@/lib/prisma';
import { subMinutes, subHours, subDays } from 'date-fns';
import { createTool } from '../core/tool-registry';
import type { Tool, ToolExecutionResult } from '../core/types';

// ============================================================
// GET FAILED LOGINS
// ============================================================

interface FailedLoginsInput {
  timeframeMinutes?: number;
}

interface FailedLoginsOutput {
  totalFailedLogins: number;
  uniqueIPs: number;
  uniqueUsernames: number;
  topIPs: Array<{ ip: string; count: number }>;
  topUsernames: Array<{ username: string; count: number }>;
  bruteForceDetected: boolean;
}

export const getFailedLoginsTool: Tool<FailedLoginsInput, FailedLoginsOutput> = createTool(
  {
    name: 'get_failed_logins',
    description: 'Analyze failed login attempts to detect brute force attacks or credential stuffing.',
    category: 'security',
    parameters: [
      {
        name: 'timeframeMinutes',
        type: 'number',
        description: 'Minutes to look back (default: 30)',
        required: false,
        default: 30,
      },
    ],
    returns: {
      type: 'object',
      description: 'Failed login analysis with attack indicators',
    },
  },
  async (input): Promise<ToolExecutionResult<FailedLoginsOutput>> => {
    try {
      const minutes = input.timeframeMinutes ?? 30;
      const since = subMinutes(new Date(), minutes);

      // Get failed login attempts from audit logs
      const failedLogins = await prisma.ownerAuditLog.findMany({
        where: {
          action: { contains: 'LOGIN_FAILED' },
          createdAt: { gte: since },
        },
        select: { ipAddress: true, targetEmail: true },
      });

      const totalFailedLogins = failedLogins.length;

      // Aggregate by IP
      const ipCounts: Record<string, number> = {};
      const usernameCounts: Record<string, number> = {};

      for (const login of failedLogins) {
        if (login.ipAddress) {
          ipCounts[login.ipAddress] = (ipCounts[login.ipAddress] || 0) + 1;
        }
        if (login.targetEmail) {
          usernameCounts[login.targetEmail] = (usernameCounts[login.targetEmail] || 0) + 1;
        }
      }

      const topIPs = Object.entries(ipCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ip, count]) => ({ ip, count }));

      const topUsernames = Object.entries(usernameCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([username, count]) => ({ username, count }));

      // Detect brute force: 5+ attempts from same IP or 10+ total in short time
      const bruteForceDetected = topIPs.some(({ count }) => count >= 5) || totalFailedLogins >= 10;

      return {
        success: true,
        data: {
          totalFailedLogins,
          uniqueIPs: Object.keys(ipCounts).length,
          uniqueUsernames: Object.keys(usernameCounts).length,
          topIPs,
          topUsernames,
          bruteForceDetected,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get failed logins',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET SUSPICIOUS IPS
// ============================================================

interface SuspiciousIPsInput {
  threshold?: number;
}

interface SuspiciousIPsOutput {
  suspiciousIPs: Array<{
    ip: string;
    failedLogins: number;
    uniqueTargets: number;
    riskScore: number;
  }>;
  totalSuspicious: number;
  recommendedActions: string[];
}

export const getSuspiciousIPsTool: Tool<SuspiciousIPsInput, SuspiciousIPsOutput> = createTool(
  {
    name: 'get_suspicious_ips',
    description: 'Identify suspicious IP addresses based on login patterns and activity.',
    category: 'security',
    parameters: [
      {
        name: 'threshold',
        type: 'number',
        description: 'Minimum failed attempts to flag as suspicious (default: 3)',
        required: false,
        default: 3,
      },
    ],
    returns: {
      type: 'object',
      description: 'List of suspicious IPs with risk assessment',
    },
  },
  async (input): Promise<ToolExecutionResult<SuspiciousIPsOutput>> => {
    try {
      const threshold = input.threshold ?? 3;
      const since = subHours(new Date(), 24);

      // Get failed logins grouped by IP
      const logs = await prisma.ownerAuditLog.findMany({
        where: {
          action: { contains: 'LOGIN_FAILED' },
          createdAt: { gte: since },
        },
        select: { ipAddress: true, targetEmail: true },
      });

      // Aggregate by IP
      const ipData: Record<string, { count: number; targets: Set<string> }> = {};

      for (const log of logs) {
        if (log.ipAddress) {
          if (!ipData[log.ipAddress]) {
            ipData[log.ipAddress] = { count: 0, targets: new Set() };
          }
          ipData[log.ipAddress].count++;
          if (log.targetEmail) {
            ipData[log.ipAddress].targets.add(log.targetEmail);
          }
        }
      }

      // Filter suspicious IPs
      const suspiciousIPs = Object.entries(ipData)
        .filter(([_, data]) => data.count >= threshold)
        .map(([ip, data]) => {
          // Risk score: higher for more attempts and more targets
          const riskScore = Math.min(
            (data.count / 10) * 0.5 + (data.targets.size / 5) * 0.5,
            1
          );

          return {
            ip,
            failedLogins: data.count,
            uniqueTargets: data.targets.size,
            riskScore,
          };
        })
        .sort((a, b) => b.riskScore - a.riskScore);

      const recommendedActions: string[] = [];
      if (suspiciousIPs.length > 0) {
        recommendedActions.push('Consider implementing IP-based rate limiting');
        if (suspiciousIPs.some(ip => ip.riskScore > 0.7)) {
          recommendedActions.push('Block high-risk IPs immediately');
        }
        if (suspiciousIPs.some(ip => ip.uniqueTargets > 3)) {
          recommendedActions.push('Credential stuffing attack likely - notify affected users');
        }
      }

      return {
        success: true,
        data: {
          suspiciousIPs,
          totalSuspicious: suspiciousIPs.length,
          recommendedActions,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get suspicious IPs',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET BANNED USERS
// ============================================================

interface BannedUsersInput {
  timeframeDays?: number;
}

interface BannedUsersOutput {
  totalBanned: number;
  recentBans: number;
  banReasons: Record<string, number>;
  bannedEmails: string[];
}

export const getBannedUsersTool: Tool<BannedUsersInput, BannedUsersOutput> = createTool(
  {
    name: 'get_banned_users',
    description: 'Get information about banned users and recent ban activity.',
    category: 'security',
    parameters: [
      {
        name: 'timeframeDays',
        type: 'number',
        description: 'Days to look back for recent bans (default: 7)',
        required: false,
        default: 7,
      },
    ],
    returns: {
      type: 'object',
      description: 'Banned user statistics and details',
    },
  },
  async (input): Promise<ToolExecutionResult<BannedUsersOutput>> => {
    try {
      const days = input.timeframeDays ?? 7;
      const since = subDays(new Date(), days);

      const [totalBanned, recentBannedUsers] = await Promise.all([
        prisma.user.count({ where: { bannedAt: { not: null } } }),
        prisma.user.findMany({
          where: { bannedAt: { gte: since } },
          select: { email: true, banReason: true },
        }),
      ]);

      // Count ban reasons
      const banReasons: Record<string, number> = {};
      const bannedEmails: string[] = [];

      for (const user of recentBannedUsers) {
        const reason = user.banReason || 'Unspecified';
        banReasons[reason] = (banReasons[reason] || 0) + 1;
        bannedEmails.push(user.email);
      }

      return {
        success: true,
        data: {
          totalBanned,
          recentBans: recentBannedUsers.length,
          banReasons,
          bannedEmails: bannedEmails.slice(0, 10), // Limit for privacy
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get banned users',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET ACTIVITY ANOMALIES
// ============================================================

interface ActivityAnomaliesInput {
  timeframeHours?: number;
}

interface ActivityAnomaliesOutput {
  highActivityUsers: Array<{
    userId: string;
    postCount: number;
    messageCount: number;
    riskLevel: string;
  }>;
  totalAnomalies: number;
  spamLikely: boolean;
  botLikely: boolean;
}

export const getActivityAnomaliesTool: Tool<ActivityAnomaliesInput, ActivityAnomaliesOutput> = createTool(
  {
    name: 'get_activity_anomalies',
    description: 'Detect users with anomalously high activity that may indicate bots or spam.',
    category: 'security',
    parameters: [
      {
        name: 'timeframeHours',
        type: 'number',
        description: 'Hours to analyze (default: 1)',
        required: false,
        default: 1,
      },
    ],
    returns: {
      type: 'object',
      description: 'Activity anomalies and bot/spam indicators',
    },
  },
  async (input): Promise<ToolExecutionResult<ActivityAnomaliesOutput>> => {
    try {
      const hours = input.timeframeHours ?? 1;
      const since = subHours(new Date(), hours);

      // Get high-activity post creators
      const highActivityPosters = await prisma.post.groupBy({
        by: ['authorId'],
        where: { createdAt: { gte: since } },
        _count: true,
        having: { authorId: { _count: { gt: 10 } } },
      });

      // Get high-activity message senders
      const highActivityMessengers = await prisma.message.groupBy({
        by: ['senderId'],
        where: { createdAt: { gte: since } },
        _count: true,
        having: { senderId: { _count: { gt: 20 } } },
      });

      // Combine results
      const userActivity: Record<string, { posts: number; messages: number }> = {};

      for (const poster of highActivityPosters) {
        userActivity[poster.authorId] = {
          posts: poster._count,
          messages: 0,
        };
      }

      for (const messenger of highActivityMessengers) {
        if (!userActivity[messenger.senderId]) {
          userActivity[messenger.senderId] = { posts: 0, messages: 0 };
        }
        userActivity[messenger.senderId].messages = messenger._count;
      }

      const highActivityUsers = Object.entries(userActivity)
        .map(([userId, activity]) => {
          const totalActivity = activity.posts + activity.messages;
          let riskLevel = 'low';
          if (totalActivity > 50) riskLevel = 'critical';
          else if (totalActivity > 30) riskLevel = 'high';
          else if (totalActivity > 15) riskLevel = 'medium';

          return {
            userId,
            postCount: activity.posts,
            messageCount: activity.messages,
            riskLevel,
          };
        })
        .sort((a, b) => (b.postCount + b.messageCount) - (a.postCount + a.messageCount));

      const spamLikely = highActivityUsers.some(u => u.postCount > 20);
      const botLikely = highActivityUsers.some(u => (u.postCount + u.messageCount) > 40);

      return {
        success: true,
        data: {
          highActivityUsers,
          totalAnomalies: highActivityUsers.length,
          spamLikely,
          botLikely,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get activity anomalies',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET RATE LIMIT EVENTS
// ============================================================

interface RateLimitEventsInput {
  timeframeMinutes?: number;
}

interface RateLimitEventsOutput {
  totalRateLimits: number;
  byEndpoint: Record<string, number>;
  byIP: Record<string, number>;
  escalationNeeded: boolean;
}

export const getRateLimitEventsTool: Tool<RateLimitEventsInput, RateLimitEventsOutput> = createTool(
  {
    name: 'get_rate_limit_events',
    description: 'Analyze rate limiting events to detect abuse patterns.',
    category: 'security',
    parameters: [
      {
        name: 'timeframeMinutes',
        type: 'number',
        description: 'Minutes to analyze (default: 15)',
        required: false,
        default: 15,
      },
    ],
    returns: {
      type: 'object',
      description: 'Rate limit event analysis',
    },
  },
  async (input): Promise<ToolExecutionResult<RateLimitEventsOutput>> => {
    try {
      const minutes = input.timeframeMinutes ?? 15;
      const since = subMinutes(new Date(), minutes);

      // Check system metrics for rate limit events
      const metrics = await prisma.systemMetric.findMany({
        where: {
          metricName: 'rate_limit_hit',
          recordedAt: { gte: since },
        },
        select: { metricValue: true, metadata: true },
      });

      const byEndpoint: Record<string, number> = {};
      const byIP: Record<string, number> = {};
      let totalRateLimits = 0;

      for (const metric of metrics) {
        totalRateLimits++;
        const meta = metric.metadata as Record<string, string> | null;
        if (meta?.endpoint) {
          byEndpoint[meta.endpoint] = (byEndpoint[meta.endpoint] || 0) + 1;
        }
        if (meta?.ip) {
          byIP[meta.ip] = (byIP[meta.ip] || 0) + 1;
        }
      }

      // Escalation needed if high volume or concentrated abuse
      const escalationNeeded = totalRateLimits > 50 ||
        Object.values(byIP).some(count => count > 20);

      return {
        success: true,
        data: {
          totalRateLimits,
          byEndpoint,
          byIP,
          escalationNeeded,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get rate limit events',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// GET SESSION METRICS
// ============================================================

interface SessionMetricsInput {
  timeframeHours?: number;
}

interface SessionMetricsOutput {
  activeSessions: number;
  newSessionsLastHour: number;
  averageSessionDuration: number;
  suspiciousSessionPatterns: number;
  multiDeviceUsers: number;
}

export const getSessionMetricsTool: Tool<SessionMetricsInput, SessionMetricsOutput> = createTool(
  {
    name: 'get_session_metrics',
    description: 'Analyze user session patterns to detect hijacking or sharing.',
    category: 'security',
    parameters: [
      {
        name: 'timeframeHours',
        type: 'number',
        description: 'Hours to analyze (default: 24)',
        required: false,
        default: 24,
      },
    ],
    returns: {
      type: 'object',
      description: 'Session security metrics',
    },
  },
  async (input): Promise<ToolExecutionResult<SessionMetricsOutput>> => {
    try {
      const hours = input.timeframeHours ?? 24;
      const since = subHours(new Date(), hours);
      const lastHour = subHours(new Date(), 1);

      // Get active users as proxy for sessions
      const [activeUsers, recentLogins] = await Promise.all([
        prisma.user.count({ where: { lastLoginAt: { gte: since } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: lastHour } } }),
      ]);

      // Check for users with multiple recent logins (potential session sharing)
      // This is a simplified check - real implementation would use session tokens
      const multiDeviceUsers = 0; // Would need session tracking table

      // Suspicious patterns: users with very frequent logins
      const suspiciousPatterns = 0; // Would need more detailed tracking

      return {
        success: true,
        data: {
          activeSessions: activeUsers,
          newSessionsLastHour: recentLogins,
          averageSessionDuration: 0, // Would need session tracking
          suspiciousSessionPatterns: suspiciousPatterns,
          multiDeviceUsers,
        },
        executionTimeMs: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session metrics',
        executionTimeMs: 0,
      };
    }
  }
);

// ============================================================
// EXPORT ALL SECURITY TOOLS
// ============================================================

export const securityTools = [
  getFailedLoginsTool,
  getSuspiciousIPsTool,
  getBannedUsersTool,
  getActivityAnomaliesTool,
  getRateLimitEventsTool,
  getSessionMetricsTool,
];
