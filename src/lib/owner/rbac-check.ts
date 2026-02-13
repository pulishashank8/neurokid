/**
 * Owner RBAC Check for API Routes
 * 
 * Secure helper functions to verify OWNER role in API endpoints.
 * Includes audit logging for all owner actions.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasRole } from '../rbac';
import { logOwnerAction, type AuditAction } from './audit-logger';

interface OwnerAuthResult {
  authorized: boolean;
  userId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Verify that the current user has OWNER role
 * Returns userId if authorized, or error details if not
 */
export async function verifyOwnerRole(request?: NextRequest): Promise<OwnerAuthResult> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return {
        authorized: false,
        error: 'Not authenticated',
        statusCode: 401,
      };
    }
    
    const userId = session.user.id;
    const isOwner = await hasRole(userId, 'OWNER');
    
    if (!isOwner) {
      // Log unauthorized access attempt
      if (request) {
        await logOwnerAction({
          userId,
          action: 'OWNER_LOGIN_FAILED',
          details: { reason: 'Missing OWNER role' },
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || undefined,
          success: false,
        });
      }
      
      return {
        authorized: false,
        error: 'Forbidden: OWNER role required',
        statusCode: 403,
      };
    }
    
    return {
      authorized: true,
      userId,
    };
  } catch (error) {
    console.error('[rbac-check] Error verifying owner role:', error);
    return {
      authorized: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}

/**
 * Verify OWNER role and log the action
 * This is the main function to use in API routes
 */
export async function requireOwnerWithAudit(
  request: NextRequest,
  action: AuditAction,
  resource?: string,
  details?: Record<string, any>
): Promise<string> {
  const auth = await verifyOwnerRole(request);
  
  if (!auth.authorized || !auth.userId) {
    throw new Error(auth.error || 'Unauthorized');
  }
  
  // Log the action
  await logOwnerAction({
    userId: auth.userId,
    action,
    resource,
    details,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
    success: true,
  });
  
  return auth.userId;
}

/**
 * Middleware-style wrapper for owner API routes
 * 
 * Usage:
 * ```
 * export const GET = withOwnerAuth(async (request, { ownerId }) => {
 *   // Your handler code here
 *   return NextResponse.json({ data: 'secure' });
 * }, 'VIEW_DASHBOARD');
 * ```
 */
export function withOwnerAuth<T = any>(
  handler: (
    request: NextRequest,
    context: { ownerId: string; params?: any }
  ) => Promise<Response>,
  action: AuditAction,
  options?: {
    resource?: string;
    getResource?: (request: NextRequest, params?: any) => string;
  }
) {
  return async (request: NextRequest, context?: { params?: any }) => {
    try {
      // Verify OWNER role
      const auth = await verifyOwnerRole(request);
      
      if (!auth.authorized || !auth.userId) {
        return new Response(
          JSON.stringify({ error: auth.error || 'Unauthorized' }),
          {
            status: auth.statusCode || 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Determine resource identifier
      const resource =
        options?.resource ||
        (options?.getResource ? options.getResource(request, context?.params) : undefined);
      
      // Log the action
      await logOwnerAction({
        userId: auth.userId,
        action,
        resource,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent') || undefined,
        success: true,
      });
      
      // Call the actual handler
      return await handler(request, {
        ownerId: auth.userId,
        params: context?.params,
      });
    } catch (error: any) {
      console.error('[withOwnerAuth] Handler error:', error);
      
      // Log the failed action
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await logOwnerAction({
          userId: session.user.id,
          action,
          details: { error: error.message },
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || undefined,
          success: false,
        });
      }
      
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
