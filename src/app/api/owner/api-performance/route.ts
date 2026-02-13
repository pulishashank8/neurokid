import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getApiPerformanceMetrics } from '@/lib/owner/api-performance';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysBack = Math.min(7, Math.max(1, parseInt(searchParams.get('days') ?? '1', 10)));

    const metrics = await getApiPerformanceMetrics(daysBack);

    return NextResponse.json(metrics);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner API Perf] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API performance', detail: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
