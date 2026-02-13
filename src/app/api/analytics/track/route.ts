/**
 * Client-side analytics event tracking
 * Authenticated users can track engagement events via this API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { trackEvent } from '@/lib/analytics/events';
import { withApiHandler } from '@/lib/api/apiHandler';
import { z } from 'zod';

const trackSchema = z.object({
  eventType: z.string().min(1).max(100),
  featureName: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

async function handler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : undefined;

    const body = await request.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await trackEvent({
      userId: userId ?? undefined,
      eventType: parsed.data.eventType,
      featureName: parsed.data.featureName,
      metadata: parsed.data.metadata,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Analytics] Track API error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}

export const POST = withApiHandler(handler);
