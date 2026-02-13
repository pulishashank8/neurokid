/**
 * POST /api/owner/digest/send-now
 * Manually trigger sending a digest email (for testing).
 * Body: { type: 'DAILY' | 'WEEKLY' | 'MONTHLY' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { renderDigestHtml, DigestType } from '@/lib/owner/digest/email-renderer';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = (process.env.EMAIL_FROM || 'onboarding@resend.dev').replace(/[<>]/g, '');

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json(
      { error: 'Email not configured. Set RESEND_API_KEY in environment variables.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const type = (body?.type || 'DAILY') as DigestType;
    if (!['DAILY', 'WEEKLY', 'MONTHLY'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use DAILY, WEEKLY, or MONTHLY' }, { status: 400 });
    }

    const config = await prisma.digestConfig.findUnique({ where: { digestType: type } });
    const recipient = config?.recipientEmail?.trim() || body.recipientEmail?.trim();

    if (!recipient) {
      return NextResponse.json(
        { error: `No recipient configured for ${type}. Set recipient email in Digest Settings first.` },
        { status: 400 }
      );
    }

    const now = new Date();
    const html = await renderDigestHtml(type);
    const subject =
      type === 'DAILY'
        ? `NeuroKid Daily Brief — ${now.toISOString().slice(0, 10)} (Test)`
        : type === 'WEEKLY'
          ? `NeuroKid Weekly Analytics — ${now.toISOString().slice(0, 10)} (Test)`
          : `NeuroKid Monthly Executive — ${now.toISOString().slice(0, 7)} (Test)`;

    const { data, error } = await resend.emails.send({
      from: `NeuroKid <${from}>`,
      to: recipient,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (config) {
      await prisma.digestConfig.update({
        where: { digestType: type },
        data: { lastSentAt: now },
      });
    }

    return NextResponse.json({ ok: true, message: `Digest sent to ${recipient}`, id: data?.id });
  } catch (err) {
    console.error('[owner/digest/send-now]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send digest' },
      { status: 500 }
    );
  }
}
