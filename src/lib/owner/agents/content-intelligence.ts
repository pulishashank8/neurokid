/**
 * Content Intelligence Agent
 * Monitors spam, trending content, content gaps, and quality
 */

import { prisma } from '@/lib/prisma';
import { subDays, subHours } from 'date-fns';
import type { AgentInsight, AgentResult, AgentContext } from './types';

export async function runContentIntelligenceAgent(context: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const insights: AgentInsight[] = [];

  try {
    const { now } = context;
    const lastHour = subHours(now, 1);
    const last24h = subHours(now, 24);
    const lastWeek = subDays(now, 7);

    // Check for potential spam (users posting too frequently)
    const recentPostsByUser = await prisma.post.groupBy({
      by: ['authorId'],
      where: { createdAt: { gte: lastHour } },
      _count: true,
      having: { authorId: { _count: { gt: 5 } } },
    });

    // Get trending posts (high engagement)
    const trendingPosts = await prisma.post.findMany({
      where: { createdAt: { gte: last24h } },
      include: {
        _count: {
          select: { comments: true, votes: true },
        },
      },
      orderBy: { votes: { _count: 'desc' } },
      take: 5,
    });

    // Content volume metrics
    const [postsToday, postsLastWeek, commentsToday] = await Promise.all([
      prisma.post.count({ where: { createdAt: { gte: last24h } } }),
      prisma.post.count({ where: { createdAt: { gte: lastWeek } } }),
      prisma.comment.count({ where: { createdAt: { gte: last24h } } }),
    ]);

    // Check for orphaned categories (categories with no posts)
    const categoriesWithNoPosts = await prisma.category.findMany({
      where: {
        posts: { none: {} },
      },
      take: 5,
    });

    // Generate content insights

    // Spam detection
    if (recentPostsByUser.length > 0) {
      insights.push({
        agentType: 'CONTENT_INTELLIGENCE',
        category: 'CONTENT',
        severity: 'warning',
        title: 'Potential spam detected',
        description: `${recentPostsByUser.length} user(s) posted more than 5 times in the last hour.`,
        recommendation: 'Review these users for potential spam behavior and consider rate limiting.',
        metrics: { suspiciousUsers: recentPostsByUser.length },
        confidence: 0.85,
      });
    }

    // Trending content
    if (trendingPosts.length > 0 && trendingPosts[0]._count.votes > 10) {
      const topPost = trendingPosts[0];
      insights.push({
        agentType: 'CONTENT_INTELLIGENCE',
        category: 'CONTENT',
        severity: 'info',
        title: 'Trending content detected',
        description: `Post "${topPost.title?.slice(0, 50)}..." is trending with ${topPost._count.votes} votes and ${topPost._count.comments} comments.`,
        recommendation: 'Consider featuring or promoting this popular content.',
        metrics: { votes: topPost._count.votes, comments: topPost._count.comments },
        confidence: 0.9,
      });
    }

    // Content engagement rate
    const engagementRate = postsToday > 0 ? commentsToday / postsToday : 0;
    if (engagementRate < 0.5 && postsToday > 5) {
      insights.push({
        agentType: 'CONTENT_INTELLIGENCE',
        category: 'CONTENT',
        severity: 'info',
        title: 'Low content engagement',
        description: `Only ${engagementRate.toFixed(1)} comments per post today. Users may need encouragement to engage.`,
        recommendation: 'Consider adding engagement prompts or highlighting unanswered posts.',
        metrics: { postsToday, commentsToday, engagementRate },
        confidence: 0.75,
      });
    }

    // Content gaps
    if (categoriesWithNoPosts.length > 0) {
      insights.push({
        agentType: 'CONTENT_INTELLIGENCE',
        category: 'CONTENT',
        severity: 'info',
        title: 'Content gaps identified',
        description: `${categoriesWithNoPosts.length} categories have no posts: ${categoriesWithNoPosts.map(c => c.name).join(', ')}`,
        recommendation: 'Consider creating seed content or prompting users to post in these categories.',
        metrics: { emptyCategories: categoriesWithNoPosts.length },
        confidence: 0.8,
      });
    }

    // Weekly content summary
    const postsPerDay = postsLastWeek / 7;
    insights.push({
      agentType: 'CONTENT_INTELLIGENCE',
      category: 'CONTENT',
      severity: 'info',
      title: 'Weekly content summary',
      description: `${postsLastWeek} posts created this week (avg ${postsPerDay.toFixed(1)}/day). ${postsToday} posts today.`,
      metrics: { postsLastWeek, postsPerDay, postsToday },
      confidence: 1.0,
    });

    return {
      agentType: 'CONTENT_INTELLIGENCE',
      success: true,
      insights,
      executionTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentType: 'CONTENT_INTELLIGENCE',
      success: false,
      insights: [],
      executionTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
