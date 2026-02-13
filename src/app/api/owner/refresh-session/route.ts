import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasRole } from '@/lib/rbac';

/**
 * POST /api/owner/refresh-session
 * Checks the current NextAuth session and returns time remaining
 * 
 * Updated to use NextAuth sessions instead of deprecated admin-auth system
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Check if user has OWNER role
    const isOwner = await hasRole(session.user.id, 'OWNER');
    
    if (!isOwner) {
      return NextResponse.json({ 
        error: 'Not authorized' 
      }, { status: 403 });
    }

    // Calculate actual time remaining based on login time
    // Sessions expire after 30 minutes
    const loginAt = (session as any).loginAt || Date.now();
    const MAX_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
    const timeRemaining = Math.max(0, MAX_SESSION_DURATION - (Date.now() - loginAt));
    const expiresAt = Date.now() + timeRemaining;
    
    return NextResponse.json({ 
      success: true,
      timeRemaining,
      expiresAt 
    });
  } catch (error) {
    console.error('[Refresh Session] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh session' 
    }, { status: 500 });
  }
}
