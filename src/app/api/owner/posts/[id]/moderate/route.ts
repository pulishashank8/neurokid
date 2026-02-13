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
  const { action } = body;

  try {
    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'remove':
        updateData = { status: 'REMOVED' };
        break;
      case 'restore':
        updateData = { status: 'ACTIVE' };
        break;
      case 'lock':
        updateData = { isLocked: true };
        break;
      case 'unlock':
        updateData = { isLocked: false };
        break;
      case 'pin':
        updateData = { isPinned: true, pinnedAt: new Date() };
        break;
      case 'unpin':
        updateData = { isPinned: false, pinnedAt: null };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    await logModerationAction({
      actionType: action.toUpperCase(),
      targetType: 'post',
      targetId: id,
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error moderating post:', error);
    return NextResponse.json({ error: 'Failed to moderate post' }, { status: 500 });
  }
}
