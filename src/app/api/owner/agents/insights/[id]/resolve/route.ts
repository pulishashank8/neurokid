import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/owner/agents/insights/[id]/resolve
 * Marks an insight as resolved
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await isAdminAuthenticated())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const insight = await prisma.aIAgentInsight.update({
            where: { id },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, insight });
    } catch (error) {
        console.error('Error resolving insight:', error);
        return NextResponse.json(
            { error: 'Failed to resolve insight' },
            { status: 500 }
        );
    }
}
