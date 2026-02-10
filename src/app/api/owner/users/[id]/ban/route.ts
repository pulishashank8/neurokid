import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { rotateUserSessions } from '@/lib/auth/session-rotation';

async function verifyOwnerAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('owner_session')?.value;
  if (!token) return false;
  
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  
  const crypto = await import('crypto');
  const expectedToken = crypto.createHash('sha256').update(adminPassword).digest('hex');
  return token === expectedToken;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyOwnerAuth())) {
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

    // Rotate sessions to immediately invalidate all existing sessions
    await rotateUserSessions(id, `User banned: ${reason || 'No reason provided'}`);

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
  if (!(await verifyOwnerAuth())) {
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

    // Rotate sessions to force re-authentication after unban
    await rotateUserSessions(id, 'User unbanned');

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
  }
}
