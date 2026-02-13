/**
 * Page view tracking - Pillar 13
 * Records PageView for time-on-page and scroll depth
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : undefined;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const pagePath = typeof body.pagePath === 'string' ? body.pagePath : '/';
    const pageTitle = typeof body.pageTitle === 'string' ? body.pageTitle : null;
    const duration = typeof body.duration === 'number' ? body.duration : 0;
    const scrollDepth = typeof body.scrollDepth === 'number' ? body.scrollDepth : null;
    const deviceType = typeof body.deviceType === 'string' ? body.deviceType.slice(0, 20) : null;
    const referrer = typeof body.referrer === 'string' ? body.referrer : null;

    await prisma.pageView.create({
      data: {
        userId: userId ?? null,
        pagePath,
        pageTitle,
        duration,
        scrollDepth,
        deviceType,
        referrer,
        enteredAt: new Date(Date.now() - duration),
        leftAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Analytics PageView] Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
