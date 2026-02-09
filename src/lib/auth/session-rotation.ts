/**
 * Session Rotation Utility
 * 
 * Provides functions to force session rotation when user privileges change.
 * This prevents privilege escalation attacks by invalidating existing sessions
 * when roles or permissions are modified.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'session-rotation' });

/**
 * Increment the user's session version to invalidate all existing sessions.
 * Should be called whenever:
 * - User roles are changed (grant/revoke)
 * - User is banned/unbanned
 * - Sensitive profile changes (email, password)
 * 
 * @param userId - The user ID to rotate sessions for
 * @param reason - The reason for rotation (for audit logging)
 * @returns The new session version number
 */
export async function rotateUserSessions(
  userId: string,
  reason: string
): Promise<number> {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
      select: {
        id: true,
        sessionVersion: true,
        email: true,
      },
    });

    logger.info(
      {
        userId,
        newVersion: updated.sessionVersion,
        reason,
      },
      'User sessions rotated'
    );

    return updated.sessionVersion;
  } catch (error) {
    logger.error(
      { error, userId, reason },
      'Failed to rotate user sessions'
    );
    throw error;
  }
}

/**
 * Rotate all sessions for users with a specific role.
 * Useful when role permissions are changed globally.
 * 
 * @param role - The role that was modified
 * @param reason - The reason for rotation
 * @returns Number of affected users
 */
export async function rotateSessionsByRole(
  role: string,
  reason: string
): Promise<number> {
  try {
    const result = await prisma.$executeRaw`
      UPDATE "User"
      SET "sessionVersion" = "sessionVersion" + 1
      WHERE id IN (
        SELECT "userId" FROM "UserRole" WHERE role = ${role}
      )
    `;

    logger.info(
      {
        role,
        affectedUsers: result,
        reason,
      },
      'Sessions rotated for role'
    );

    return result;
  } catch (error) {
    logger.error(
      { error, role, reason },
      'Failed to rotate sessions for role'
    );
    throw error;
  }
}

/**
 * Get the current session version for a user.
 * 
 * @param userId - The user ID
 * @returns The current session version
 */
export async function getSessionVersion(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  });

  return user?.sessionVersion || 0;
}

/**
 * Check if a session version is valid for a user.
 * 
 * @param userId - The user ID
 * @param version - The session version to check
 * @returns True if the version matches the user's current version
 */
export async function isSessionVersionValid(
  userId: string,
  version: number
): Promise<boolean> {
  const currentVersion = await getSessionVersion(userId);
  return currentVersion === version;
}
