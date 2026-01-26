import { NextResponse } from 'next/server';
import { getSessionTimeRemaining, isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  
  if (!authenticated) {
    return NextResponse.json({ 
      authenticated: false,
      timeRemaining: 0,
    });
  }

  const timeRemaining = await getSessionTimeRemaining();
  
  return NextResponse.json({ 
    authenticated: true,
    timeRemaining,
  });
}
