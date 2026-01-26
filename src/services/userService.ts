import { prisma } from '@/lib/prisma';
import { sanitizeUser } from '@/lib/security';
import { logger } from '@/lib/logger';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  bio?: string;
  roles: string[];
  createdAt: Date;
  lastLoginAt?: Date | null;
}

export interface UserWithStats extends UserProfile {
  postsCount: number;
  commentsCount: number;
  votesReceived: number;
}

export class UserService {
  async findById(userId: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          userRoles: true,
        },
      });

      if (!user) return null;

      return this.toUserProfile(user);
    } catch (error) {
      logger.error({ error, userId }, 'Failed to find user by ID');
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          userRoles: true,
        },
      });

      if (!user) return null;

      return this.toUserProfile(user);
    } catch (error) {
      logger.error({ error, email: email.substring(0, 3) + '***' }, 'Failed to find user by email');
      throw error;
    }
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { username },
        include: {
          user: {
            include: {
              userRoles: true,
            },
          },
        },
      });

      if (!profile?.user) return null;

      return {
        id: profile.user.id,
        email: profile.user.email,
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio || undefined,
        roles: profile.user.userRoles.map((r: { role: string }) => r.role),
        createdAt: profile.user.createdAt,
        lastLoginAt: profile.user.lastLoginAt,
      };
    } catch (error) {
      logger.error({ error, username }, 'Failed to find user by username');
      throw error;
    }
  }

  async getUserWithStats(userId: string): Promise<UserWithStats | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          userRoles: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
      });

      if (!user) return null;

      const userPosts = await prisma.post.findMany({
        where: { authorId: userId },
        select: { id: true },
      });
      const postIds = userPosts.map(p => p.id);
      
      const votesReceived = postIds.length > 0 ? await prisma.vote.count({
        where: {
          targetType: 'POST',
          targetId: { in: postIds },
          value: 1,
        },
      }) : 0;

      return {
        ...this.toUserProfile(user),
        postsCount: user._count.posts,
        commentsCount: user._count.comments,
        votesReceived,
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user with stats');
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      logger.error({ error, userId }, 'Failed to update last login');
    }
  }

  async banUser(userId: string, reason: string, bannedBy: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: reason,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: bannedBy,
          action: 'USER_BANNED',
          targetType: 'user',
          targetId: userId,
          changes: { reason },
        },
      });

      logger.info({ userId, bannedBy, reason }, 'User banned');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to ban user');
      throw error;
    }
  }

  async unbanUser(userId: string, unbannedBy: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: false,
          bannedAt: null,
          bannedReason: null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: unbannedBy,
          action: 'USER_UNBANNED',
          targetType: 'user',
          targetId: userId,
        },
      });

      logger.info({ userId, unbannedBy }, 'User unbanned');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to unban user');
      throw error;
    }
  }

  async deleteUser(userId: string, deletedBy: string): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: deletedBy,
          action: 'USER_DELETED',
          targetType: 'user',
          targetId: userId,
        },
      });

      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info({ userId, deletedBy }, 'User deleted');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to delete user');
      throw error;
    }
  }

  private toUserProfile(user: {
    id: string;
    email: string;
    createdAt: Date;
    lastLoginAt: Date | null;
    profile?: { username: string; displayName: string; bio?: string | null } | null;
    userRoles: { role: string }[];
  }): UserProfile {
    return sanitizeUser({
      id: user.id,
      email: user.email,
      username: user.profile?.username,
      displayName: user.profile?.displayName,
      bio: user.profile?.bio || undefined,
      roles: user.userRoles.map((r) => r.role),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });
  }
}

export const userService = new UserService();
