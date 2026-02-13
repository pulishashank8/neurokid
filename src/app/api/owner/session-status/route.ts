import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasRole } from '@/lib/rbac';

/**
 * GET /api/owner/session-status
 * Returns current session status and time remaining
 * 
 * Updated to use NextAuth sessions instead of deprecated admin-auth system
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        authenticated: false, 
        timeRemaining: 0 
      });
    }

    // Check if user has OWNER role
    const isOwner = await hasRole(session.user.id, 'OWNER');
    
    if (!isOwner) {
      return NextResponse.json({ 
        authenticated: false, 
        timeRemaining: 0 
      });
    }

    // Calculate actual time remaining based on login time
    // Sessions expire after 30 minutes
    const loginAt = (session as any).loginAt || Date.now();
    const MAX_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
    const timeRemaining = Math.max(0, MAX_SESSION_DURATION - (Date.now() - loginAt));
    
    return NextResponse.json({ 
      authenticated: true, 
      timeRemaining 
    });
  } catch (error) {
    console.error('[Session Status] Error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      timeRemaining: 0 
    }, { status: 500 });
  }
}
