import { NextRequest, NextResponse } from 'next/server';
import { scheduledRetentionJob } from '@/lib/owner/data-retention';

/**
 * Cron endpoint for scheduled data retention policy execution
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/data-retention",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 * 
 * Or call manually: curl -X POST https://your-domain.com/api/cron/data-retention \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (Vercel provides CRON_SECRET automatically)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await scheduledRetentionJob();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Data Retention Cron Error]', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (remove in production)
export async function GET() {
  try {
    const result = await scheduledRetentionJob();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      note: 'This was a manual test run',
    });
  } catch (error) {
    console.error('[Data Retention Manual Run Error]', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
