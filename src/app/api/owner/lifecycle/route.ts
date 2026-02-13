import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const distribution = await prisma.userLifecycleStage.groupBy({
      by: ['stage'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
    });

    return NextResponse.json({
      distribution: distribution.map((d) => ({ stage: d.stage, count: d._count.userId })),
    });
  } catch (error) {
    console.error('[Lifecycle] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lifecycle' }, { status: 500 });
  }
}
