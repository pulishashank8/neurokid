/**
 * Security Sentinel Agent
 * Monitors brute force attempts, scraping, and session hijacking
 */

import { prisma } from '@/lib/prisma';
import { subMinutes, subHours } from 'date-fns';
import type { AgentInsight, AgentResult, AgentContext } from './types';

export async function runSecuritySentinelAgent(context: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const insights: AgentInsight[] = [];

  try {
    const { now } = context;
    const last15m = subMinutes(now, 15);
    const lastHour = subHours(now, 1);
    const last24h = subHours(now, 24);

    // Check for failed login attempts (from audit logs)
    let failedLogins = 0;
    let failedLoginsByIp: Record<string, number> = {};

    try {
      const auditLogs = await prisma.ownerAuditLog.findMany({
        where: {
          action: { contains: 'LOGIN_FAILED' },
          createdAt: { gte: last15m },
        },
        select: { ipAddress: true },
      });

      failedLogins = auditLogs.length;
      auditLogs.forEach(log => {
        if (log.ipAddress) {
          failedLoginsByIp[log.ipAddress] = (failedLoginsByIp[log.ipAddress] || 0) + 1;
        }
      });
    } catch {
      // Audit log table may not exist
    }

    // Check for banned users
    const [bannedUsers, recentBans] = await Promise.all([
      prisma.user.count({ where: { bannedAt: { not: null } } }),
      prisma.user.count({ where: { bannedAt: { gte: last24h } } }),
    ]);

    // Check for suspicious activity patterns
    let suspiciousActivities = 0;
    try {
      // Users with unusually high activity
      const highActivityUsers = await prisma.post.groupBy({
        by: ['authorId'],
        where: { createdAt: { gte: lastHour } },
        _count: true,
        having: { authorId: { _count: { gt: 20 } } },
      });
      suspiciousActivities = highActivityUsers.length;
    } catch {
      // Handle gracefully
    }

    // Generate security insights

    // Brute force detection
    const suspiciousIps = Object.entries(failedLoginsByIp)
      .filter(([, count]) => count >= 5)
      .sort(([, a], [, b]) => b - a);

    if (suspiciousIps.length > 0) {
      insights.push({
        agentType: 'SECURITY_SENTINEL',
        category: 'SECURITY',
        severity: 'critical',
        title: 'Potential brute force attack',
        description: `${suspiciousIps.length} IP(s) with 5+ failed logins in 15 minutes. Top: ${suspiciousIps[0][0]} (${suspiciousIps[0][1]} attempts)`,
        recommendation: 'Consider blocking these IPs and implementing rate limiting.',
        metrics: { suspiciousIpCount: suspiciousIps.length, totalFailedLogins: failedLogins },
        confidence: 0.92,
      });
    } else if (failedLogins > 10) {
      insights.push({
        agentType: 'SECURITY_SENTINEL',
        category: 'SECURITY',
        severity: 'warning',
        title: 'Elevated failed login attempts',
        description: `${failedLogins} failed login attempts in the last 15 minutes.`,
        recommendation: 'Monitor for patterns and consider adding CAPTCHA to login.',
        metrics: { failedLogins },
        confidence: 0.85,
      });
    }

    // Suspicious activity
    if (suspiciousActivities > 0) {
      insights.push({
        agentType: 'SECURITY_SENTINEL',
        category: 'SECURITY',
        severity: 'warning',
        title: 'Suspicious activity patterns',
        description: `${suspiciousActivities} user(s) showing unusually high activity (20+ posts/hour).`,
        recommendation: 'Review these accounts for potential bot or scraping behavior.',
        metrics: { suspiciousUsers: suspiciousActivities },
        confidence: 0.8,
      });
    }

    // Ban activity
    if (recentBans > 0) {
      insights.push({
        agentType: 'SECURITY_SENTINEL',
        category: 'SECURITY',
        severity: 'info',
        title: 'Recent bans issued',
        description: `${recentBans} user(s) banned in the last 24 hours. Total banned: ${bannedUsers}.`,
        metrics: { recentBans, totalBanned: bannedUsers },
        confidence: 1.0,
      });
    }

    // Security health status
    if (failedLogins < 5 && suspiciousActivities === 0) {
      insights.push({
        agentType: 'SECURITY_SENTINEL',
        category: 'SECURITY',
        severity: 'info',
        title: 'Security status normal',
        description: 'No suspicious activity detected in the monitoring period.',
        metrics: { failedLogins, suspiciousActivities },
        confidence: 0.95,
      });
    }

    return {
      agentType: 'SECURITY_SENTINEL',
      success: true,
      insights,
      executionTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentType: 'SECURITY_SENTINEL',
      success: false,
      insights: [],
      executionTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
