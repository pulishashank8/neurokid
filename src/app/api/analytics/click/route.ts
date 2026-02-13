/**
 * Click event tracking - Pillar 13
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
    const elementId = typeof body.elementId === 'string' ? body.elementId : null;
    const elementType = typeof body.elementType === 'string' ? body.elementType.slice(0, 50) : null;

    await prisma.clickEvent.create({
      data: {
        userId: userId ?? null,
        pagePath,
        elementId,
        elementType,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Analytics Click] Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
