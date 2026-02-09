import { getServerSession as getServerSessionBase } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Re-export authOptions for use in other files
export { authOptions };

export interface SessionWithRoles extends Session {
  user: Session['user'] & {
    id: string;
    roles: string[];
  };
}

/**
 * Get the current server session with roles
 */
export async function getServerSession(): Promise<SessionWithRoles | null> {
  const session = (await getServerSessionBase(authOptions)) as SessionWithRoles | null;
  return session;
}

/**
 * Get current user with profile and roles
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      userRoles: true,
    },
  });

  return user;
}

/**
 * Assert user is authenticated, throw error if not
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Get user by ID (admin/internal use)
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userRoles: true,
    },
  });
}
