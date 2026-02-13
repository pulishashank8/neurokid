/**
 * System Metrics Cron
 *
 * Collects system metrics for Owner Dashboard.
 * Secured by CRON_SECRET (Bearer token) or owner auth.
 *
 * Vercel Cron: Add to vercel.json:
 *   "crons": [{ "path": "/api/cron/system-metrics", "schedule": "*\/5 * * * *" }]
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { collectSystemMetrics } from '@/lib/system-metrics/collector';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth =
    cronSecret &&
    authHeader?.startsWith('Bearer ') &&
    authHeader.slice(7) === cronSecret;

  if (!hasCronAuth && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await collectSystemMetrics();
    return NextResponse.json({ ok: true, message: 'Metrics collected' });
  } catch (error) {
    console.error('[Cron] System metrics failed:', error);
    return NextResponse.json(
      { error: 'Metrics collection failed' },
      { status: 500 }
    );
  }
}
