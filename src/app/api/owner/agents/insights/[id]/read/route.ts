import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/owner/agents/insights/[id]/read
 * Marks an insight as read
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
            data: { isRead: true },
        });

        return NextResponse.json({ success: true, insight });
    } catch (error) {
        console.error('Error marking insight as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark insight as read' },
            { status: 500 }
        );
    }
}
