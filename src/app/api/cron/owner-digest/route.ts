/**
 * Cron: owner-digest - Send daily/weekly/monthly digest emails
 * Configure: daily 8am, weekly Mon 9am, monthly 1st 9am
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { renderDigestHtml, DigestType } from '@/lib/owner/digest/email-renderer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = (process.env.EMAIL_FROM || 'onboarding@resend.dev').replace(/[<>]/g, '');

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const day = now.getDay();
  const date = now.getDate();
  const hour = now.getHours();

  const toSend: DigestType[] = [];
  if (hour === 8) toSend.push('DAILY');
  if (day === 1 && hour === 9) toSend.push('WEEKLY');
  if (date === 1 && hour === 9) toSend.push('MONTHLY');

  if (toSend.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'Not digest time' });
  }

  if (!resend) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 500 });
  }

  try {
    for (const type of toSend) {
      const config = await prisma.digestConfig.findUnique({
        where: { digestType: type },
      });
      if (!config || !config.isEnabled || !config.recipientEmail) continue;

      const html = await renderDigestHtml(type);
      const subject =
        type === 'DAILY'
          ? `NeuroKid Daily Brief — ${now.toISOString().slice(0, 10)}`
          : type === 'WEEKLY'
            ? `NeuroKid Weekly Analytics — ${now.toISOString().slice(0, 10)}`
            : `NeuroKid Monthly Executive — ${now.toISOString().slice(0, 7)}`;

      await resend.emails.send({
        from: `NeuroKid <${from}>`,
        to: config.recipientEmail,
        subject,
        html,
      });

      await prisma.digestConfig.update({
        where: { digestType: type },
        data: { lastSentAt: now },
      });
    }
    return NextResponse.json({ ok: true, sent: toSend });
  } catch (err) {
    console.error('[cron/owner-digest]', err);
    return NextResponse.json({ error: 'Digest send failed' }, { status: 500 });
  }
}
