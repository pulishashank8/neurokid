import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  runBusinessIntelligenceCalculation,
  getBusinessMetrics,
} from '@/lib/owner/business-intelligence';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const compute = searchParams.get('compute') === 'true';
    const period = (searchParams.get('period') as 'daily' | 'weekly' | 'monthly') ?? 'monthly';
    const daysBack = Math.min(365, Math.max(7, parseInt(searchParams.get('days') ?? '90', 10)));

    if (compute) {
      const result = await runBusinessIntelligenceCalculation();
      if (!result.success) {
        return NextResponse.json(
          { error: 'Computation failed', detail: result.error },
          { status: 500 }
        );
      }
    }

    const metrics = await getBusinessMetrics({
      period,
      daysBack,
    });

    return NextResponse.json({
      metrics,
      computed: compute,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Business] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch business metrics',
        detail: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
