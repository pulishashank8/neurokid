/**
 * POST /api/feedback
 * User-facing feedback submission - Quick reactions, NPS, bug reports, feature requests
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { sendBugAlert } from '@/lib/owner/cofounder/bug-alert';

const FEEDBACK_TYPES = ['QUICK_REACTION', 'NPS', 'BUG_REPORT', 'FEATURE_REQUEST'] as const;
const MAX_TEXT_LENGTH = 5000;

export async function POST(request: NextRequest) {
  console.log('[api/feedback] === New feedback request ===');
  
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : undefined;

    console.log('[api/feedback] Session check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId,
      userEmail: session?.user?.email || 'none'
    });

    if (!userId) {
      console.log('[api/feedback] ❌ No userId - returning 401');
      return NextResponse.json({ error: 'Please sign in to submit feedback' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    console.log('[api/feedback] Request body:', {
      type: body.type,
      hasText: !!body.text,
      textLength: typeof body.text === 'string' ? body.text.length : 0,
      category: body.category
    });
    const type = typeof body.type === 'string' ? body.type.toUpperCase() : '';
    const rating = typeof body.rating === 'number' ? body.rating : body.rating != null ? Number(body.rating) : null;
    const text = typeof body.text === 'string' ? body.text.slice(0, MAX_TEXT_LENGTH) : null;
    const category = typeof body.category === 'string' ? body.category.slice(0, 100) : null;
    const pagePath = typeof body.pagePath === 'string' ? body.pagePath.slice(0, 500) : null;
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : null;

    if (!FEEDBACK_TYPES.includes(type as (typeof FEEDBACK_TYPES)[number])) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }

    // Validation by type
    if (type === 'NPS' && (rating == null || rating < 0 || rating > 10)) {
      return NextResponse.json({ error: 'NPS rating must be 0-10' }, { status: 400 });
    }
    if (type === 'QUICK_REACTION' && (rating == null || (rating !== 1 && rating !== -1))) {
      return NextResponse.json({ error: 'Quick reaction must be 1 or -1' }, { status: 400 });
    }
    if ((type === 'BUG_REPORT' || type === 'FEATURE_REQUEST') && (!text || text.trim().length < 5)) {
      return NextResponse.json({ error: 'Text required (min 5 characters)' }, { status: 400 });
    }

    const feedback = await prisma.userFeedback.create({
      data: {
        userId,
        type,
        rating: rating != null ? rating : undefined,
        text: text?.trim() || undefined,
        category: category || undefined,
        pagePath: pagePath || undefined,
        metadata: metadata ?? undefined,
      },
    });

    // Send immediate bug alert for high-priority bug reports
    if (type === 'BUG_REPORT' && text) {
      // Determine severity based on keywords or category
      const severityKeywords = {
        critical: ['crash', 'data loss', 'cannot access', 'broken', 'not working', 'error', 'failed'],
        high: ['bug', 'issue', 'problem', 'doesn\'t work', 'won\'t', 'can\'t'],
      };

      const textLower = text.toLowerCase();
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

      if (severityKeywords.critical.some(keyword => textLower.includes(keyword))) {
        severity = 'critical';
      } else if (severityKeywords.high.some(keyword => textLower.includes(keyword))) {
        severity = 'high';
      }

      // Only send alerts for high and critical bugs
      if (severity === 'high' || severity === 'critical') {
        const userAgent = request.headers.get('user-agent') || undefined;
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

        // Fetch user details separately since UserFeedback doesn't have user relation
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        }).catch(() => null);

        sendBugAlert({
          id: feedback.id,
          severity,
          title: text.substring(0, 100),
          description: text,
          reportedBy: user?.profile?.displayName || user?.email || 'Anonymous User',
          reportedAt: feedback.createdAt,
          context: {
            userAgent,
            url: pagePath || undefined,
            ipAddress,
          },
        }).catch(error => {
          console.error('[api/feedback] Failed to send bug alert:', error);
          // Don't fail the feedback submission if alert fails
        });
      }
    }

    console.log('[api/feedback] ✅ Success - Feedback created:', feedback.id);
    return NextResponse.json({ ok: true, id: feedback.id });
  } catch (err) {
    console.error('[api/feedback] ❌ Error:', err);
    return NextResponse.json({ 
      error: 'Failed to submit feedback',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
