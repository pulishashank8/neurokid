/**
 * DEPRECATED: Legacy admin authentication system
 * 
 * This file is kept for backward compatibility but should NOT be used.
 * Owner authentication now uses NextAuth with OWNER role check.
 * 
 * See: src/lib/auth.ts and src/lib/rbac.ts for the new secure system.
 */

import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasRole } from './rbac';

/**
 * Check if the current user has OWNER role (secure RBAC-based auth)
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return false;
    
    // Check if user has OWNER role in database
    return await hasRole(session.user.id, 'OWNER');
  } catch (error) {
    console.error('[admin-auth] Error checking authentication:', error);
    return false;
  }
}

/**
 * Get the authenticated owner user ID
 */
export async function getAuthenticatedOwnerId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    
    const isOwner = await hasRole(session.user.id, 'OWNER');
    return isOwner ? session.user.id : null;
  } catch (error) {
    console.error('[admin-auth] Error getting owner ID:', error);
    return null;
  }
}

/**
 * Check if user is authenticated and has OWNER role
 * Throws error if not authenticated
 */
export async function requireOwnerAuth(): Promise<string> {
  const ownerId = await getAuthenticatedOwnerId();
  if (!ownerId) {
    throw new Error('Unauthorized: OWNER role required');
  }
  return ownerId;
}

// Legacy functions for backward compatibility
export function isPasswordConfigured(): boolean {
  console.warn('[admin-auth] isPasswordConfigured is deprecated. Use NextAuth with OWNER role.');
  return false;
}

export async function getSessionTimeRemaining(): Promise<number> {
  console.warn('[admin-auth] getSessionTimeRemaining is deprecated.');
  return 0;
}

export function validateAdminPassword(password: string): boolean {
  console.warn('[admin-auth] validateAdminPassword is deprecated. Use NextAuth.');
  return false;
}

export async function setAdminSession(): Promise<number> {
  console.warn('[admin-auth] setAdminSession is deprecated. Use NextAuth.');
  return 0;
}

export async function refreshAdminSession(): Promise<number | null> {
  console.warn('[admin-auth] refreshAdminSession is deprecated.');
  return null;
}

export async function clearAdminSession(): Promise<void> {
  console.warn('[admin-auth] clearAdminSession is deprecated.');
}
