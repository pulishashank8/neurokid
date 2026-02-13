import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { logModerationAction } from '@/lib/owner/moderation-log';
import { sendWarningEmail } from '@/lib/mailer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { reason } = body as { reason?: string };

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    await sendWarningEmail(user.email, reason);

    await logModerationAction({
      actionType: 'WARN',
      targetType: 'user',
      targetId: id,
      reason: reason ?? undefined,
    });

    return NextResponse.json({ success: true, message: 'Warning email sent' });
  } catch (error) {
    console.error('Error sending warning email:', error);
    return NextResponse.json(
      { error: 'Failed to send warning email' },
      { status: 500 }
    );
  }
}
