import { NextResponse } from 'next/server';
import { isAdminAuthenticated, getSessionTimeRemaining } from '@/lib/admin-auth';

/**
 * GET /api/owner/session-status
 * Returns current session status and time remaining
 */
export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    
    if (!authenticated) {
      return NextResponse.json({ 
        authenticated: false, 
        timeRemaining: 0 
      });
    }

    const timeRemaining = await getSessionTimeRemaining();
    
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
