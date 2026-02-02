import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logSecurityEvent } from '@/lib/securityAudit';

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

export class DataGovernanceService {
  async exportUserData(userId: string): Promise<UserDataExport> {
    logger.info({ userId }, 'Starting user data export');

    const user = await prisma.user.findUnique({
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
      throw new Error('User not found');
    }

    await logSecurityEvent({
      action: 'ADMIN_ACTION',
      userId,
      resource: 'data_export',
      details: { action: 'user_data_exported' },
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

    await prisma.$transaction([
      prisma.profile.deleteMany({
        where: { userId },
      }),

      prisma.comment.updateMany({
        where: { authorId: userId },
        data: { content: '[Comment removed]' },
      }),

      prisma.post.updateMany({
        where: { authorId: userId },
        data: {
          content: '[Content removed]',
          title: '[Post removed]',
        },
      }),

      prisma.message.updateMany({
        where: { senderId: userId },
        data: { content: '[Message removed]' },
      }),

      prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          hashedPassword: null,
        },
      }),
    ]);

    await logSecurityEvent({
      action: 'ACCOUNT_DELETED',
      userId: deletedBy,
      resource: 'user',
      resourceId: userId,
      details: { action: 'user_data_anonymized' },
    });

    logger.info({ userId, deletedBy }, 'User data anonymized');
  }

  async deleteUserCompletely(userId: string, deletedBy: string): Promise<void> {
    logger.info({ userId, deletedBy }, 'Starting complete user deletion');

    await logSecurityEvent({
      action: 'ACCOUNT_DELETED',
      userId: deletedBy,
      resource: 'user',
      resourceId: userId,
      details: { action: 'user_completely_deleted' },
    });

    await prisma.user.delete({
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
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: { lt: thirtyDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: { lt: ninetyDaysAgo },
        },
      }),
      prisma.post.count({
        where: { status: 'REMOVED' },
      }),
      prisma.auditLog.count({
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

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    logger.info({ deletedCount: result.count, olderThanDays }, 'Cleaned up old audit logs');

    return result.count;
  }
}

export const dataGovernanceService = new DataGovernanceService();
