import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await context.params;

    // Fetch user with all relevant data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: true,
        posts: {
          select: { id: true },
        },
        comments: {
          select: { id: true },
        },
        votes: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format response to match what the page expects
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLogin, // Map lastLogin to lastLoginAt
      loginCount: user.loginCount || 0,
      isBanned: user.banned, // Map banned to isBanned
      bannedReason: user.bannedReason,
      bannedUntil: user.bannedUntil,
      ownerNotes: [], // Empty array for owner notes
      userRoles: user.userRoles || [], // Keep the full userRoles array
      profile: {
        displayName: user.name || user.username,
        username: user.username,
      },
      _count: {
        posts: user.posts.length,
        comments: user.comments.length,
        votes: user.votes.length,
      },
      // Empty arrays for posts/comments since page checks .length
      posts: [],
      comments: [],
      auditLogs: [], // Add audit logs array
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('[User Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
