import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/owner/agents/status
 * Returns the status of all AI agents
 */
export async function GET() {
    try {
        if (!(await isAdminAuthenticated())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get insight counts per agent in the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const insightCounts = await prisma.aIAgentInsight.groupBy({
            by: ['agentType'],
            where: {
                createdAt: {
                    gte: oneDayAgo,
                },
            },
            _count: {
                id: true,
            },
        });

        const countMap = new Map(
            insightCounts.map(item => [item.agentType, item._count.id])
        );

        // Define agent configurations
        const agents = [
            {
                type: 'BUSINESS_ANALYST',
                name: 'Business Analyst',
                description: 'Monitors growth, costs, KPIs, and unit economics',
                schedule: 'Hourly',
                enabled: true,
                insights24h: countMap.get('BUSINESS_ANALYST') || 0,
                status: 'idle' as const,
            },
            {
                type: 'LEGAL_COMPLIANCE',
                name: 'Legal Compliance',
                description: 'Monitors GDPR, consent, content liability, and COPPA',
                schedule: 'Every 6h',
                enabled: true,
                insights24h: countMap.get('LEGAL_COMPLIANCE') || 0,
                status: 'idle' as const,
            },
            {
                type: 'UX_AGENT',
                name: 'UX Agent',
                description: 'Monitors errors, crashes, rage clicks, and slow pages',
                schedule: 'Every 15min',
                enabled: true,
                insights24h: countMap.get('UX_AGENT') || 0,
                status: 'idle' as const,
            },
            {
                type: 'CONTENT_INTELLIGENCE',
                name: 'Content Intelligence',
                description: 'Monitors spam, trending topics, content gaps, and quality',
                schedule: 'Hourly',
                enabled: true,
                insights24h: countMap.get('CONTENT_INTELLIGENCE') || 0,
                status: 'idle' as const,
            },
            {
                type: 'SECURITY_SENTINEL',
                name: 'Security Sentinel',
                description: 'Monitors brute force, scraping, and session hijacking',
                schedule: 'Every 15min',
                enabled: true,
                insights24h: countMap.get('SECURITY_SENTINEL') || 0,
                status: 'idle' as const,
            },
            {
                type: 'GROWTH_STRATEGIST',
                name: 'Growth Strategist',
                description: 'Analyzes forecasts, retention, and feature adoption',
                schedule: 'Daily',
                enabled: true,
                insights24h: countMap.get('GROWTH_STRATEGIST') || 0,
                status: 'idle' as const,
            },
            {
                type: 'ISSUE_FIXER',
                name: 'Issue Fixer',
                description: 'Auto-remediates issues found by other agents',
                schedule: 'Hourly',
                enabled: true,
                insights24h: countMap.get('ISSUE_FIXER') || 0,
                status: 'idle' as const,
            },
        ];

        return NextResponse.json({ agents });
    } catch (error) {
        console.error('Error fetching agent status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agent status' },
            { status: 500 }
        );
    }
}
