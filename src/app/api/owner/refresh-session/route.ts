import { NextResponse } from 'next/server';
import { refreshAdminSession } from '@/lib/admin-auth';

/**
 * POST /api/owner/refresh-session
 * Refreshes the admin session and returns new expiration time
 */
export async function POST() {
  try {
    const expiresAt = await refreshAdminSession();
    
    if (!expiresAt) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const timeRemaining = expiresAt - Date.now();
    
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
