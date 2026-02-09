/**
 * Data Deletion Processor (Phase 7.4.5 - GDPR Compliance)
 *
 * Implements GDPR Article 17 (Right to Erasure)
 * - Deletes personal data
 * - Anonymizes posts/comments to preserve community content
 * - Provides 30-day grace period
 */

import { prisma } from '@/lib/prisma';

export class DataDeletionProcessor {
  /**
   * Delete all user data (GDPR Right to Erasure)
   */
  async deleteUserData(userId: string, reason: string = 'USER_REQUEST'): Promise<void> {
    console.log(`[DataDeletion] Starting deletion for user ${userId}, reason: ${reason}`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Anonymize posts (keep community content)
        await tx.post.updateMany({
          where: { authorId: userId },
          data: {
            authorId: null,
            isAnonymous: true,
          },
        });

        // 2. Soft delete comments by anonymizing them
        await tx.comment.updateMany({
          where: { authorId: userId },
          data: {
            content: '[deleted]',
            isAnonymous: true,
          },
        });

        // 3. Delete messages (personal data)
        await tx.message.deleteMany({
          where: { senderId: userId },
        });

        // 4. Delete daily wins (personal data)
        await tx.dailyWin.deleteMany({
          where: { userId },
        });

        // 5. Delete therapy sessions (PHI - must delete)
        await tx.therapySession.deleteMany({
          where: { userId },
        });

        // 6. Delete emergency cards (PHI - must delete)
        await tx.emergencyCard.deleteMany({
          where: { userId },
        });

        // 7. Delete bookmarks
        await tx.bookmark.deleteMany({
          where: { userId },
        });

        // 8. Delete votes
        await tx.vote.deleteMany({
          where: { userId },
        });

        // 9. Delete connections
        await tx.connection.deleteMany({
          where: {
            OR: [{ userA: userId }, { userB: userId }],
          },
        });

        // 10. Delete notifications
        await tx.notification.deleteMany({
          where: { userId },
        });

        // 11. Delete AI conversations
        await tx.aIConversation.deleteMany({
          where: { userId },
        });

        // 12. Delete user sessions
        await tx.userSession.deleteMany({
          where: { userId },
        });

        // 13. Anonymize audit logs (keep for compliance, remove PII)
        await tx.auditLog.updateMany({
          where: { userId },
          data: {
            ipAddress: null,
            userAgent: null,
          },
        });

        // 14. Delete profile
        await tx.profile.deleteMany({
          where: { userId },
        });

        // 15. Delete user roles
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // 16. Finally, soft delete user account
        await tx.user.update({
          where: { id: userId },
          data: {
            email: `deleted-${userId}@neurokind.deleted`,
            hashedPassword: null,
            emailVerified: false,
            isBanned: true,
            bannedReason: `Account deleted: ${reason}`,
            bannedAt: new Date(),
          },
        });

        console.log(`[DataDeletion] Completed for user ${userId}`);
      });
    } catch (error) {
      console.error(`[DataDeletion] Failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule deletion with 30-day grace period
   */
  async scheduleDataDeletion(userId: string, deletionDate: Date): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_DELETION_SCHEDULED',
        targetType: 'USER',
        targetId: userId,
        changes: {
          scheduledFor: deletionDate.toISOString(),
          reason: 'USER_REQUEST',
        } as any,
      },
    });

    console.log(`[DataDeletion] Scheduled for ${deletionDate.toISOString()}`);
  }

  /**
   * Cancel scheduled deletion (user changed mind within 30 days)
   */
  async cancelScheduledDeletion(userId: string): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_DELETION_CANCELLED',
        targetType: 'USER',
        targetId: userId,
      },
    });

    console.log(`[DataDeletion] Cancelled for user ${userId}`);
  }
}
