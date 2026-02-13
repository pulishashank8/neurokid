/**
 * Digest settings CRUD - Pillar 18
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const configs = await prisma.digestConfig.findMany({ orderBy: { digestType: 'asc' } });
    return NextResponse.json({ configs });
  } catch (err) {
    console.error('[owner/digest/settings]', err);
    return NextResponse.json({ error: 'Failed to fetch digest settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { digestType, isEnabled, sendTime, recipientEmail } = body;
    if (!digestType) return NextResponse.json({ error: 'digestType required' }, { status: 400 });

    const config = await prisma.digestConfig.upsert({
      where: { digestType },
      create: {
        digestType,
        isEnabled: Boolean(isEnabled ?? false),
        sendTime: sendTime ?? (digestType === 'DAILY' ? '08:00' : '09:00'),
        recipientEmail: recipientEmail && typeof recipientEmail === 'string' ? recipientEmail : 'owner@neurokid.help',
      },
      update: {
        ...(isEnabled !== undefined && { isEnabled: Boolean(isEnabled) }),
        ...(sendTime !== undefined && { sendTime }),
        ...(recipientEmail !== undefined && { recipientEmail }),
      },
    });
    return NextResponse.json({ config });
  } catch (err) {
    console.error('[owner/digest/settings]', err);
    return NextResponse.json({ error: 'Failed to update digest settings' }, { status: 500 });
  }
}
