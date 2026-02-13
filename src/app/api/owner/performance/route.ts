import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getSystemPerformanceTimeSeries } from '@/lib/owner/api-performance';
import { withApiHandler } from '@/lib/api/apiHandler';

async function handler(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') ?? '24h') as
      | '24h'
      | '7d'
      | '30d';
    if (!['24h', '7d', '30d'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    const data = await getSystemPerformanceTimeSeries(period);

    return NextResponse.json({ data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Performance] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch performance data',
        detail: process.env.NODE_ENV === 'development' ? msg : undefined,
      },
      { status: 500 }
    );
  }
}

export const GET = withApiHandler(handler);
