/**
 * Anomaly Detection Cron
 * Run every 15 minutes via Vercel Cron
 *
 * Runs deterministic anomaly detection first (real data to SystemAnomaly),
 * then optionally invokes AI agent for executive report.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { runAnomalyDetection } from '@/lib/owner/anomaly-detection';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth =
    cronSecret && authHeader?.startsWith('Bearer ') && authHeader.slice(7) === cronSecret;

  if (!hasCronAuth && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runAnomalyDetection();

    return NextResponse.json({
      ok: true,
      message: 'Anomaly detection completed',
    });
  } catch (error) {
    console.error('[Cron] Anomaly detection failed:', error);
    return NextResponse.json(
      {
        error: 'Anomaly detection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
