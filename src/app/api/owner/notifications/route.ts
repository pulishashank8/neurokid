import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const unreadOnly = searchParams.get('unread') === 'true';
    const skip = (page - 1) * limit;

    const where = unreadOnly ? { isRead: false } : {};
    const [notifications, total] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminNotification.count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('[Notifications] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, severity, message, relatedEntity, metadata } = body;
    if (!type || !severity || !message) {
      return NextResponse.json({ error: 'type, severity, message required' }, { status: 400 });
    }

    const notification = await prisma.adminNotification.create({
      data: {
        type: String(type),
        severity: String(severity),
        message: String(message),
        relatedEntity: relatedEntity ? String(relatedEntity) : null,
        metadata: metadata ?? undefined,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('[Notifications] Create error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
