/**
 * Resource Authorization Guard
 * 
 * Standardized ownership checks across all resources
 * Ensures consistent authorization patterns
 */

import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";
import type { Role } from "@prisma/client";

export type ResourceType =
  | "TherapySession"
  | "EmergencyCard"
  | "DailyWin"
  | "Post"
  | "Comment"
  | "AIConversation";

export type ActionType = "read" | "create" | "update" | "delete" | "admin";

export interface AuthorizationContext {
  userId: string;
  userRoles: Role[];
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthorizationResult {
  allowed: boolean;
  resource?: any;
  reason?: string;
}

export class ResourceGuard {
  /**
   * Check if user owns resource or has admin access
   */
  static async authorize(
    resourceType: ResourceType,
    resourceId: string,
    action: ActionType,
    context: AuthorizationContext
  ): Promise<AuthorizationResult> {
    // Find resource
    const resource = await this.findResource(resourceType, resourceId);

    if (!resource) {
      return { allowed: false, reason: "Resource not found" };
    }

    // Check ownership
    const isOwner = resource.userId === context.userId;

    if (isOwner) {
      // Owner can do anything except admin actions
      if (action === "admin") {
        return this.checkAdmin(context, resourceType, action);
      }
      return { allowed: true, resource };
    }

    // Not owner - check admin/moderator permissions
    return this.checkElevatedPermissions(
      context,
      resourceType,
      action,
      resource
    );
  }

  /**
   * Strict ownership check - no admin override
   * Use for PHI resources
   */
  static async strictOwnership(
    resourceType: "TherapySession" | "EmergencyCard" | "DailyWin",
    resourceId: string,
    userId: string
  ): Promise<AuthorizationResult> {
    const resource = await this.findResource(resourceType, resourceId);

    if (!resource) {
      return { allowed: false, reason: "Resource not found" };
    }

    if (resource.userId !== userId) {
      // Log unauthorized access attempt
      await AuditLogger.log({
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        userId,
        resourceType,
        resourceId,
        metadata: {
          actualOwner: resource.userId,
          attemptedAction: "access",
        },
      });

      return { allowed: false, reason: "Access denied" };
    }

    return { allowed: true, resource };
  }

  /**
   * Batch authorization - check multiple resources
   */
  static async authorizeMany(
    resourceType: ResourceType,
    resourceIds: string[],
    action: ActionType,
    context: AuthorizationContext
  ): Promise<{ allowed: string[]; denied: string[] }> {
    const results = await Promise.all(
      resourceIds.map(async (id) => ({
        id,
        result: await this.authorize(resourceType, id, action, context),
      }))
    );

    return {
      allowed: results.filter((r) => r.result.allowed).map((r) => r.id),
      denied: results.filter((r) => !r.result.allowed).map((r) => r.id),
    };
  }

  /**
   * Check if user has required role
   */
  static hasRole(userRoles: Role[], requiredRole: Role): boolean {
    return userRoles.includes(requiredRole);
  }

  /**
   * Check if user has any of the required roles
   */
  static hasAnyRole(userRoles: Role[], requiredRoles: Role[]): boolean {
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  // Private methods

  private static async findResource(
    type: ResourceType,
    id: string
  ): Promise<any | null> {
    switch (type) {
      case "TherapySession":
        return prisma.therapySession.findUnique({ where: { id } });
      case "EmergencyCard":
        return prisma.emergencyCard.findUnique({ where: { id } });
      case "DailyWin":
        return prisma.dailyWin.findUnique({ where: { id } });
      case "Post":
        return prisma.post.findUnique({ where: { id } });
      case "Comment":
        return prisma.comment.findUnique({ where: { id } });
      case "AIConversation":
        return prisma.aIConversation.findUnique({ where: { id } });
      default:
        return null;
    }
  }

  private static checkAdmin(
    context: AuthorizationContext,
    resourceType: ResourceType,
    action: ActionType
  ): AuthorizationResult {
    const isAdmin = context.userRoles.includes("ADMIN");

    if (!isAdmin) {
      return {
        allowed: false,
        reason: "Admin access required",
      };
    }

    return { allowed: true };
  }

  private static async checkElevatedPermissions(
    context: AuthorizationContext,
    resourceType: ResourceType,
    action: ActionType,
    resource: any
  ): Promise<AuthorizationResult> {
    const isAdmin = context.userRoles.includes("ADMIN");
    const isModerator = context.userRoles.includes("MODERATOR");

    // Admin can do anything
    if (isAdmin) {
      await AuditLogger.log({
        action: "ADMIN_PHI_ACCESSED",
        userId: context.userId,
        resourceType,
        resourceId: resource.id,
        metadata: { action, originalOwner: resource.userId },
      });

      return { allowed: true, resource };
    }

    // Moderator can moderate community content
    if (
      isModerator &&
      (resourceType === "Post" || resourceType === "Comment") &&
      ["read", "update", "delete"].includes(action)
    ) {
      await AuditLogger.log({
        action: "ADMIN_PHI_ACCESSED",
        userId: context.userId,
        resourceType,
        resourceId: resource.id,
        metadata: { action, role: "MODERATOR" },
      });

      return { allowed: true, resource };
    }

    // Log unauthorized access
    await AuditLogger.log({
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      userId: context.userId,
      resourceType,
      resourceId: resource.id,
      metadata: {
        attemptedAction: action,
        userRoles: context.userRoles,
        actualOwner: resource.userId,
      },
    });

    return {
      allowed: false,
      reason: "Access denied - not resource owner",
    };
  }
}

/**
 * Decorator/hook for requiring authorization
 * Usage in API routes:
 * 
 * const auth = await requireAuth();
 * const result = await ResourceGuard.authorize(
 *   "TherapySession", 
 *   params.id, 
 *   "read",
 *   { userId: auth.user.id, userRoles: auth.user.roles }
 * );
 * 
 * if (!result.allowed) {
 *   return NextResponse.json({ error: result.reason }, { status: 403 });
 * }
 */
export async function requireAuthorization(
  resourceType: ResourceType,
  resourceId: string,
  action: ActionType,
  userId: string
): Promise<AuthorizationResult> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true },
  });

  return ResourceGuard.authorize(resourceType, resourceId, action, {
    userId,
    userRoles: userRoles.map((r) => r.role),
  });
}
