import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { createLogger } from '@/lib/logger';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { IAuditLogRepository } from '@/domain/interfaces/repositories/IAuditLogRepository';
import { IDatabaseConnection } from '@/infrastructure/database/DatabaseConnection';
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/domain/errors';

const logger = createLogger({ context: 'DataGovernanceService' });

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
  profile: {
    username: string;
    displayName: string;
    bio: string | null;
    location: string | null;
  } | null;
  posts: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
  }>;
  comments: Array<{
    id: string;
    content: string;
    postId: string;
    createdAt: Date;
  }>;
  messages: Array<{
    id: string;
    content: string;
    createdAt: Date;
  }>;
  votes: Array<{
    targetType: string;
    targetId: string;
    value: number;
    createdAt: Date;
  }>;
  exportedAt: Date;
}

@injectable()
export class DataGovernanceService {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) private db: IDatabaseConnection,
    @inject(TOKENS.AuditLogRepository) private auditRepo: IAuditLogRepository
  ) {
    this.prisma = db.getClient();
  }

  async exportUserData(userId: string): Promise<UserDataExport> {
    logger.info({ userId }, 'Starting user data export');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        posts: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            postId: true,
            createdAt: true,
          },
        },
        sentMessages: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        votes: {
          select: {
            targetType: true,
            targetId: true,
            value: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    await this.auditRepo.create({
      userId,
      action: 'DATA_EXPORTED',
      targetType: 'USER',
      targetId: userId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      profile: user.profile ? {
        username: user.profile.username,
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        location: user.profile.location,
      } : null,
      posts: user.posts,
      comments: user.comments,
      messages: user.sentMessages.map(m => ({
        id: m.id,
        content: m.content || "",
        createdAt: m.createdAt
      })),
      votes: user.votes.map(v => ({
        targetType: v.targetType,
        targetId: v.targetId,
        value: v.value,
        createdAt: v.createdAt,
      })),
      exportedAt: new Date(),
    };
  }

  async anonymizeUserData(userId: string, deletedBy: string): Promise<void> {
    logger.info({ userId, deletedBy }, 'Starting user data anonymization');

    const anonymizedId = `deleted_${Date.now()}`;
    const anonymizedEmail = `${anonymizedId}@deleted.neurokid.help`;

    await this.prisma.$transaction([
      this.prisma.profile.deleteMany({
        where: { userId },
      }),

      this.prisma.comment.updateMany({
        where: { authorId: userId },
        data: { content: '[Comment removed]' },
      }),

      this.prisma.post.updateMany({
        where: { authorId: userId },
        data: {
          content: '[Content removed]',
          title: '[Post removed]',
        },
      }),

      this.prisma.message.updateMany({
        where: { senderId: userId },
        data: { content: '[Message removed]' },
      }),

      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          hashedPassword: null,
        },
      }),
    ]);

    await this.auditRepo.create({
      userId: deletedBy,
      action: 'USER_ANONYMIZED',
      targetType: 'USER',
      targetId: userId,
    });

    logger.info({ userId, deletedBy }, 'User data anonymized');
  }

  async deleteUserCompletely(userId: string, deletedBy: string): Promise<void> {
    logger.info({ userId, deletedBy }, 'Starting complete user deletion');

    await this.auditRepo.create({
      userId: deletedBy,
      action: 'USER_DELETED',
      targetType: 'USER',
      targetId: userId,
    });

    await this.prisma.user.delete({
      where: { id: userId },
    });

    logger.info({ userId, deletedBy }, 'User completely deleted');
  }

  async getDataRetentionStats(): Promise<{
    totalUsers: number;
    inactiveUsers30Days: number;
    inactiveUsers90Days: number;
    deletedPostsCount: number;
    auditLogsOlderThan90Days: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [totalUsers, inactive30, inactive90, deletedPosts, oldAuditLogs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          lastLoginAt: { lt: thirtyDaysAgo },
        },
      }),
      this.prisma.user.count({
        where: {
          lastLoginAt: { lt: ninetyDaysAgo },
        },
      }),
      this.prisma.post.count({
        where: { status: 'REMOVED' },
      }),
      this.prisma.auditLog.count({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      }),
    ]);

    return {
      totalUsers,
      inactiveUsers30Days: inactive30,
      inactiveUsers90Days: inactive90,
      deletedPostsCount: deletedPosts,
      auditLogsOlderThan90Days: oldAuditLogs,
    };
  }

  async cleanupOldAuditLogs(olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    logger.info({ deletedCount: result.count, olderThanDays }, 'Cleaned up old audit logs');

    return result.count;
  }
}

// Factory function for non-DI usage
export function getDataGovernanceService(): DataGovernanceService {
  const { container, TOKENS } = require('@/lib/container');
  return (container as any).resolve(TOKENS.DataGovernanceService);
}

// Singleton instance for non-DI usage (lazy loaded)
export const dataGovernanceService: DataGovernanceService = {
  exportUserData: async (userId: string) => {
    const service = getDataGovernanceService();
    return service.exportUserData(userId);
  },
  deleteUserCompletely: async (userId: string, deletedBy: string) => {
    const service = getDataGovernanceService();
    return service.deleteUserCompletely(userId, deletedBy);
  },
  anonymizeUserData: async (userId: string, deletedBy: string) => {
    const service = getDataGovernanceService();
    return service.anonymizeUserData(userId, deletedBy);
  },
  getDataRetentionStats: async () => {
    const service = getDataGovernanceService();
    return service.getDataRetentionStats();
  },
  cleanupOldAuditLogs: async (olderThanDays?: number) => {
    const service = getDataGovernanceService();
    return service.cleanupOldAuditLogs(olderThanDays);
  },
} as DataGovernanceService;
