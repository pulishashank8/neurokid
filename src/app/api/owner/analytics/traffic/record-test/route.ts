/**
 * POST /api/owner/analytics/traffic/record-test
 * Manually record a test traffic source (for verifying the pipeline works).
 * Requires owner auth.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { recordTrafficSource } from '@/lib/owner/traffic-analytics';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { landingPage?: string; channel?: string; referrer?: string };
    const landingPage = body.landingPage || '/owner/dashboard/analytics/traffic';
    const referrer = body.referrer ?? null;
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') ?? undefined;

    await recordTrafficSource({
      userId: null,
      sessionId: null,
      referrer,
      utmSource: body.channel === 'ORGANIC' ? 'google' : null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      landingPage,
      ipAddress: ipAddress ?? null,
      country: !ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' ? 'Local' : undefined,
      skipGeoLookup: true,
    });

    return NextResponse.json({ ok: true, message: 'Test visit recorded. Click Refresh to see it.' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner Traffic Record Test] Error:', error);
    return NextResponse.json({ error: 'Failed to record', detail: msg }, { status: 500 });
  }
}
