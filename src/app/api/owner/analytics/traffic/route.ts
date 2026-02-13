import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getTrafficByChannel,
  getTopReferrers,
  getLandingPagePerformance,
  getTrafficByCountry,
  getRecentTraffic,
} from '@/lib/owner/traffic-analytics';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysBack = Math.min(90, Math.max(7, parseInt(searchParams.get('days') ?? '30', 10)));

    const [byChannel, topReferrers, landingPages, byCountry, recentTraffic] = await Promise.all([
      getTrafficByChannel(daysBack),
      getTopReferrers(daysBack),
      getLandingPagePerformance(daysBack),
      getTrafficByCountry(daysBack).catch(() => []),
      getRecentTraffic(daysBack, 50).catch(() => []),
    ]);

    return NextResponse.json({
      byChannel,
      topReferrers,
      landingPages,
      byCountry,
      recentTraffic,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Traffic] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traffic analytics', detail: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
