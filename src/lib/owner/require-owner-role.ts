/**
 * Server-side Owner Role Guard
 * 
 * Use this in server components and API routes to verify OWNER role.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

/**
 * Require OWNER role in server components
 * Redirects to login if not authenticated or not an owner
 */
export async function requireOwnerRole() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/owner/login');
  }
  
  const roles = (session.user as any).roles || [];
  const isOwner = roles.includes('OWNER');
  
  if (!isOwner) {
    redirect('/owner/login?error=unauthorized');
  }
  
  return session.user;
}
