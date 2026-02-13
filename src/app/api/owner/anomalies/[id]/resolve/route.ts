import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.systemAnomaly.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Anomalies] Resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve anomaly' }, { status: 500 });
  }
}
