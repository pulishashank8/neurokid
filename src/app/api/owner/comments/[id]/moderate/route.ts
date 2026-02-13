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
    let status: string;

    switch (action) {
      case 'remove':
        status = 'REMOVED';
        break;
      case 'hide':
        status = 'HIDDEN';
        break;
      case 'restore':
        status = 'ACTIVE';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { status: status as import('@prisma/client').CommentStatus },
    });

    await logModerationAction({
      actionType: action.toUpperCase(),
      targetType: 'comment',
      targetId: id,
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error moderating comment:', error);
    return NextResponse.json({ error: 'Failed to moderate comment' }, { status: 500 });
  }
}
