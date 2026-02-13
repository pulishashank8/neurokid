import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unresolved = searchParams.get('unresolved');

  try {
    const where = unresolved === 'true' ? { resolvedAt: null } : {};
    const anomalies = await prisma.systemAnomaly.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: 100,
    });

    const unresolvedCount = await prisma.systemAnomaly.count({
      where: { resolvedAt: null },
    });

    return NextResponse.json({ anomalies, unresolvedCount });
  } catch (error) {
    console.error('[Anomalies] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch anomalies' }, { status: 500 });
  }
}
