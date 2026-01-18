import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, role: Role): Promise<boolean> {
  const userRole = await prisma.userRole.findUnique({
    where: {
      userId_role: {
        userId,
        role,
      },
    },
  });

  return !!userRole;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
  userId: string,
  roles: Role[]
): Promise<boolean> {
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        in: roles,
      },
    },
  });

  return !!userRole;
}

/**
 * Check if current user has a specific role
 */
export async function currentUserHasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasRole(user.id, role);
}

/**
 * Check if current user has any of the specified roles
 */
export async function currentUserHasAnyRole(roles: Role[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasAnyRole(user.id, roles);
}

/**
 * Require user to have a specific role, throw error if not
 */
export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: User not authenticated");
  }

  const hasRequiredRole = await hasRole(user.id, role);
  if (!hasRequiredRole) {
    throw new Error(`Forbidden: User does not have ${role} role`);
  }

  return user;
}

/**
 * Require user to have any of the specified roles, throw error if not
 */
export async function requireAnyRole(roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: User not authenticated");
  }

  const hasRequiredRole = await hasAnyRole(user.id, roles);
  if (!hasRequiredRole) {
    throw new Error(`Forbidden: User does not have any of roles: ${roles.join(", ")}`);
  }

  return user;
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true },
  });

  return userRoles.map((ur) => ur.role);
}

/**
 * Get current user's roles
 */
export async function getCurrentUserRoles(): Promise<Role[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return getUserRoles(user.id);
}

/**
 * Grant role to user
 */
export async function grantRole(userId: string, role: Role) {
  return prisma.userRole.upsert({
    where: {
      userId_role: {
        userId,
        role,
      },
    },
    update: {},
    create: {
      userId,
      role,
    },
  });
}

/**
 * Revoke role from user
 */
export async function revokeRole(userId: string, role: Role) {
  return prisma.userRole.delete({
    where: {
      userId_role: {
        userId,
        role,
      },
    },
  });
}

/**
 * Check if user can moderate (has MODERATOR or ADMIN role)
 */
export async function canModerate(userId: string): Promise<boolean> {
  return hasAnyRole(userId, ["MODERATOR", "ADMIN"]);
}
