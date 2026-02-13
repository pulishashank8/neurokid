import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { logModerationAction } from '@/lib/owner/moderation-log';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { reason } = body;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason || 'Banned by owner',
      },
    });

    await logModerationAction({
      actionType: 'BAN',
      targetType: 'user',
      targetId: id,
      reason: reason || 'Banned by owner',
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
      },
    });

    await logModerationAction({
      actionType: 'UNBAN',
      targetType: 'user',
      targetId: id,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
  }
}
