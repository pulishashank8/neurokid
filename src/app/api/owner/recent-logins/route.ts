import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check admin session cookie authentication
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recentLogins = await prisma.user.findMany({
      where: { lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: 'desc' },
      take: 10,
      include: { profile: true },
    });

    return NextResponse.json({ recentLogins });
  } catch (error) {
    console.error('[Recent Logins API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
