/**
 * Session start tracking - records TrafficSource with UTM params
 * Call once per session from client (e.g. app layout)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { recordTrafficSource } from '@/lib/owner/traffic-analytics';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : undefined;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const referrer = typeof body.referrer === 'string' ? body.referrer : undefined;
    const landingPage = typeof body.landingPage === 'string' ? body.landingPage : '/';
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;
    const utmSource = typeof body.utmSource === 'string' ? body.utmSource : undefined;
    const utmMedium = typeof body.utmMedium === 'string' ? body.utmMedium : undefined;
    const utmCampaign = typeof body.utmCampaign === 'string' ? body.utmCampaign : undefined;
    const utmContent = typeof body.utmContent === 'string' ? body.utmContent : undefined;

    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') ?? undefined;

    await recordTrafficSource({
      userId,
      sessionId,
      referrer: referrer ?? null,
      utmSource: utmSource ?? null,
      utmMedium: utmMedium ?? null,
      utmCampaign: utmCampaign ?? null,
      utmContent: utmContent ?? null,
      landingPage: landingPage || '/',
      ipAddress: ipAddress ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Analytics Session] Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
