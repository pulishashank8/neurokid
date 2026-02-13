import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/owner/agents/insights
 * Returns all AI agent insights with optional filters
 */
export async function GET(request: Request) {
    try {
        if (!(await isAdminAuthenticated())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const agentType = searchParams.get('agentType');
        const severity = searchParams.get('severity');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        if (agentType && agentType !== 'all') {
            where.agentType = agentType;
        }

        if (severity && severity !== 'all') {
            where.severity = severity;
        }

        const insights = await prisma.aIAgentInsight.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        return NextResponse.json({ insights });
    } catch (error) {
        console.error('Error fetching insights:', error);
        return NextResponse.json(
            { error: 'Failed to fetch insights' },
            { status: 500 }
        );
    }
}
