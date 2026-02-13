/**
 * UX Agent
 * Monitors errors, crashes, rage clicks, and slow pages
 */

import { prisma } from '@/lib/prisma';
import { subMinutes, subHours } from 'date-fns';
import type { AgentInsight, AgentResult, AgentContext } from './types';

export async function runUXAgent(context: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const insights: AgentInsight[] = [];

  try {
    const { now } = context;
    const last15m = subMinutes(now, 15);
    const lastHour = subHours(now, 1);
    const last24h = subHours(now, 24);

    // Check for client errors (if ClientError table exists)
    let recentErrors = 0;
    let errorsByType: Record<string, number> = {};
    let errorsByPage: Record<string, number> = {};

    try {
      const errors = await prisma.clientError.findMany({
        where: { createdAt: { gte: last15m } },
        select: { errorType: true, pagePath: true },
      });

      recentErrors = errors.length;

      // Group by type
      errors.forEach(e => {
        errorsByType[e.errorType] = (errorsByType[e.errorType] || 0) + 1;
        errorsByPage[e.pagePath] = (errorsByPage[e.pagePath] || 0) + 1;
      });
    } catch {
      // ClientError table may not exist yet
    }

    // Check for rage clicks
    let rageClicks = 0;
    try {
      rageClicks = await prisma.clientError.count({
        where: {
          errorType: 'RAGE_CLICK',
          createdAt: { gte: lastHour },
        },
      });
    } catch {
      // Table may not exist
    }

    // Check page load times from PageView if exists
    let slowPages: { pagePath: string; avgDuration: number }[] = [];
    try {
      const pageViews = await prisma.pageView.groupBy({
        by: ['pagePath'],
        where: { createdAt: { gte: last24h } },
        _avg: { duration: true },
        _count: true,
        having: { duration: { _avg: { gt: 3000 } } },
        orderBy: { _avg: { duration: 'desc' } },
        take: 5,
      });

      slowPages = pageViews.map(p => ({
        pagePath: p.pagePath,
        avgDuration: p._avg.duration || 0,
      }));
    } catch {
      // Table may not exist
    }

    // Generate UX insights

    // Error spike detection
    if (recentErrors > 10) {
      const topErrorType = Object.entries(errorsByType)
        .sort(([, a], [, b]) => b - a)[0];
      const topErrorPage = Object.entries(errorsByPage)
        .sort(([, a], [, b]) => b - a)[0];

      insights.push({
        agentType: 'UX_AGENT',
        category: 'UX_ISSUE',
        severity: recentErrors > 50 ? 'critical' : 'warning',
        title: 'Error spike detected',
        description: `${recentErrors} errors in the last 15 minutes. Most common: ${topErrorType?.[0] || 'Unknown'} on ${topErrorPage?.[0] || 'Unknown page'}`,
        recommendation: 'Investigate the error logs and consider rolling back recent changes if needed.',
        metrics: { recentErrors, ...errorsByType },
        confidence: 0.95,
      });
    }

    // Rage click detection
    if (rageClicks > 5) {
      insights.push({
        agentType: 'UX_AGENT',
        category: 'UX_ISSUE',
        severity: 'warning',
        title: 'Rage clicks detected',
        description: `${rageClicks} rage click events in the last hour. Users may be frustrated with unresponsive UI elements.`,
        recommendation: 'Review click targets and ensure buttons/links are responding properly.',
        metrics: { rageClicks },
        confidence: 0.85,
      });
    }

    // Slow page detection
    if (slowPages.length > 0) {
      insights.push({
        agentType: 'UX_AGENT',
        category: 'UX_ISSUE',
        severity: 'info',
        title: 'Slow pages detected',
        description: `${slowPages.length} pages have average load times over 3 seconds. Slowest: ${slowPages[0]?.pagePath} (${(slowPages[0]?.avgDuration / 1000).toFixed(1)}s)`,
        recommendation: 'Optimize slow pages by reducing bundle size, lazy loading, or improving API response times.',
        metrics: { slowPageCount: slowPages.length },
        confidence: 0.8,
      });
    }

    // No recent errors - positive insight
    if (recentErrors === 0 && rageClicks === 0) {
      insights.push({
        agentType: 'UX_AGENT',
        category: 'UX_ISSUE',
        severity: 'info',
        title: 'UX health is good',
        description: 'No errors or rage clicks detected in the monitoring period.',
        metrics: { recentErrors, rageClicks },
        confidence: 0.9,
      });
    }

    return {
      agentType: 'UX_AGENT',
      success: true,
      insights,
      executionTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentType: 'UX_AGENT',
      success: false,
      insights: [],
      executionTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
