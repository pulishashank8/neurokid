import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.adminNotification.update({
      where: { id },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }
}
