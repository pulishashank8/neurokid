import { NextResponse } from 'next/server';
import { refreshAdminSession, isAdminAuthenticated } from '@/lib/admin-auth';

export async function POST() {
  const authenticated = await isAdminAuthenticated();
  
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expiresAt = await refreshAdminSession();
  
  if (expiresAt === null) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
  
  return NextResponse.json({ 
    success: true,
    expiresAt,
    timeRemaining: expiresAt - Date.now(),
  });
}
