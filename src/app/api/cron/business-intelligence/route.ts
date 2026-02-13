/**
 * Business Intelligence Cron
 * Run daily via Vercel Cron
 *
 * Computes and stores: DAU, WAU, MAU, Stickiness, Retention, Churn,
 * CAC, LTV, LTV:CAC, Feature Adoption, NPS, AI Cost per User.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { runBusinessIntelligenceCalculation } from '@/lib/owner/business-intelligence';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth =
    cronSecret && authHeader?.startsWith('Bearer ') && authHeader.slice(7) === cronSecret;

  if (!hasCronAuth && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runBusinessIntelligenceCalculation();

    return NextResponse.json({
      ok: result.success,
      metricsComputed: result.metricsComputed,
      error: result.error,
    });
  } catch (error) {
    console.error('[Cron] Business Intelligence failed:', error);
    return NextResponse.json(
      {
        error: 'Business Intelligence computation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
