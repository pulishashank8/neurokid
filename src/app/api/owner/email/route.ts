import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { sendCustomEmail } from '@/lib/mailer';

/**
 * GET /api/owner/email - List email history
 */
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip = (page - 1) * limit;

    const [emails, total] = await Promise.all([
      prisma.ownerEmail.findMany({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { recipients: true },
      }),
      prisma.ownerEmail.count(),
    ]);

    // Resolve user emails for display
    const recipientUserIds = [...new Set(emails.flatMap((e) => e.recipients.map((r) => r.userId)))];
    const users =
      recipientUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: recipientUserIds } },
            select: { id: true, email: true },
          })
        : [];
    const userEmailMap = Object.fromEntries(users.map((u) => [u.id, u.email]));

    const enriched = emails.map((e) => ({
      id: e.id,
      subject: e.subject,
      recipientCount: e.recipientCount,
      status: e.status,
      templateId: e.templateId,
      sentAt: e.sentAt,
      createdAt: e.createdAt,
      recipientEmails: e.recipients.map((r) => userEmailMap[r.userId] || r.userId),
    }));

    return NextResponse.json({
      emails: enriched,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('[Email] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch email history' }, { status: 500 });
  }
}

/**
 * POST /api/owner/email - Send email to users
 * Body: { subject, body, recipientUserIds: string[], templateId?: string }
 */
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, body: htmlBody, recipientUserIds, templateId } = body;

    if (!subject || !htmlBody || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
      return NextResponse.json(
        { error: 'subject, body, and recipientUserIds (non-empty array) are required' },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: { id: { in: recipientUserIds } },
      select: { id: true, email: true },
    });

    const validEmails = users.filter((u) => u.email).map((u) => u.email!);

    // Wrap plain text body in minimal HTML for reliable email rendering
    let htmlBodyFinal = String(htmlBody).trim();
    if (!htmlBodyFinal.startsWith('<') && !htmlBodyFinal.startsWith('<!')) {
      htmlBodyFinal = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6;">${htmlBodyFinal.replace(/\n/g, '<br/>')}</body></html>`;
    }
    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No valid user emails found for the selected recipients' }, { status: 400 });
    }

    const email = await prisma.ownerEmail.create({
      data: {
        subject: String(subject),
        body: htmlBodyFinal,
        recipientCount: validEmails.length,
        status: 'SENDING',
        templateId: templateId || null,
        recipients: {
          create: users
            .filter((u) => u.email)
            .map((u) => ({
              userId: u.id,
              deliveryStatus: 'PENDING',
            })),
        },
      },
      include: { recipients: true },
    });

    let sentCount = 0;
    let failedCount = 0;
    const results: Array<{ userId: string; status: 'sent' | 'failed'; error?: string }> = [];

    for (const u of users) {
      if (!u.email) continue;
      const result = await sendCustomEmail(u.email, subject, htmlBodyFinal);
      if (result.error) {
        failedCount++;
        results.push({ userId: u.id, status: 'failed', error: result.error });
        await prisma.ownerEmailRecipient.updateMany({
          where: { emailId: email.id, userId: u.id },
          data: { deliveryStatus: 'FAILED' },
        });
      } else {
        sentCount++;
        results.push({ userId: u.id, status: 'sent' });
        await prisma.ownerEmailRecipient.updateMany({
          where: { emailId: email.id, userId: u.id },
          data: { deliveryStatus: 'SENT' },
        });
      }
    }

    const finalStatus = failedCount === validEmails.length ? 'FAILED' : 'SENT';
    await prisma.ownerEmail.update({
      where: { id: email.id },
      data: {
        status: finalStatus,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      id: email.id,
      status: finalStatus,
      sentCount,
      failedCount,
      total: validEmails.length,
      results,
    });
  } catch (error) {
    console.error('[Email] POST error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
