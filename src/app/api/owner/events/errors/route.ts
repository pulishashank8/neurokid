/**
 * POST /api/owner/events/errors
 * Receives batched client-side errors from error-tracker.ts
 * Public endpoint (client browsers) - rate limited, origin validated
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const MAX_BATCH = 20;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        const host = new URL(origin).hostname;
        const allowed = process.env.NEXT_PUBLIC_APP_URL || 'https://neurokid.help';
        const allowedHost = new URL(allowed).hostname;
        if (host !== allowedHost && host !== 'localhost' && !host.endsWith('.localhost')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
    }

    if (request.headers.get('content-type') !== 'application/json') {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const body = await request.json();
    const raw = body?.errors;
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_BATCH) {
      return NextResponse.json({ error: 'Invalid batch size' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const records = raw.slice(0, MAX_BATCH).map((e: Record<string, unknown>) => ({
      userId,
      errorType: String(e.errorType || 'JS_ERROR'),
      message: String(e.message || 'Unknown').slice(0, 5000),
      stackTrace: e.stackTrace ? String(e.stackTrace).slice(0, 10000) : null,
      pagePath: String(e.pagePath || '/').slice(0, 500),
      pageTitle: e.pageTitle ? String(e.pageTitle).slice(0, 200) : null,
      elementId: e.elementId ? String(e.elementId).slice(0, 200) : null,
      deviceType: e.metadata?.deviceType ? String((e.metadata as Record<string, unknown>).deviceType).slice(0, 30) : null,
      userAgent: e.metadata?.userAgent ? String((e.metadata as Record<string, unknown>).userAgent).slice(0, 500) : null,
      metadata: e.metadata && typeof e.metadata === 'object' ? (e.metadata as object) : undefined,
    }));

    await prisma.clientError.createMany({ data: records });

    return NextResponse.json({ ok: true, count: records.length });
  } catch (err) {
    console.error('[events/errors]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
