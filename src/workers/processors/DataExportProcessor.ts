/**
 * Data Export Processor (Phase 7.4.4 - GDPR Compliance)
 *
 * Exports all user data in portable format for GDPR Article 20 (Right to Data Portability)
 */

import { prisma } from '@/lib/prisma';
import { FieldEncryption } from '@/lib/encryption';
import JSZip from 'jszip';

export class DataExportProcessor {
  /**
   * Export all data for a user
   * Returns download URL valid for 7 days
   */
  async exportUserData(userId: string): Promise<{ downloadUrl: string; expiresAt: Date }> {
    const zip = new JSZip();

    // 1. User profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userRoles: true,
      },
    });
    zip.file('profile.json', JSON.stringify(user, null, 2));

    // 2. Posts
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
    });
    zip.file('posts.json', JSON.stringify(posts, null, 2));

    // 3. Comments
    const comments = await prisma.comment.findMany({
      where: { authorId: userId },
    });
    zip.file('comments.json', JSON.stringify(comments, null, 2));

    // 4. Messages
    const messages = await prisma.message.findMany({
      where: { senderId: userId },
    });
    zip.file('messages.json', JSON.stringify(messages, null, 2));

    // 5. Daily Wins
    const dailyWins = await prisma.dailyWin.findMany({
      where: { userId },
    });
    zip.file('daily-wins.json', JSON.stringify(dailyWins, null, 2));

    // 6. Therapy Sessions (decrypt PHI)
    const sessions = await prisma.therapySession.findMany({
      where: { userId },
    });

    const decryptedSessions = sessions.map((s) => ({
      ...s,
      notes: s.notes ? FieldEncryption.decrypt(s.notes) : null,
      wentWell: s.wentWell ? FieldEncryption.decrypt(s.wentWell) : null,
      toWorkOn: s.toWorkOn ? FieldEncryption.decrypt(s.toWorkOn) : null,
    }));
    zip.file('therapy-sessions.json', JSON.stringify(decryptedSessions, null, 2));

    // 7. Emergency Cards (decrypt PHI)
    const cards = await prisma.emergencyCard.findMany({
      where: { userId },
    });

    const decryptedCards = cards.map((c) => ({
      ...c,
      triggers: c.triggers ? FieldEncryption.decrypt(c.triggers) : null,
      calmingStrategies: c.calmingStrategies ? FieldEncryption.decrypt(c.calmingStrategies) : null,
      communication: c.communication ? FieldEncryption.decrypt(c.communication) : null,
      medications: c.medications ? FieldEncryption.decrypt(c.medications) : null,
      allergies: c.allergies ? FieldEncryption.decrypt(c.allergies) : null,
      additionalNotes: c.additionalNotes ? FieldEncryption.decrypt(c.additionalNotes) : null,
    }));
    zip.file('emergency-cards.json', JSON.stringify(decryptedCards, null, 2));

    // 8. Bookmarks
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: { post: true },
    });
    zip.file('bookmarks.json', JSON.stringify(bookmarks, null, 2));

    // 9. Connections
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ userA: userId }, { userB: userId }],
      },
    });
    zip.file('connections.json', JSON.stringify(connections, null, 2));

    // 10. AI Conversations
    const aiConversations = await prisma.aIConversation.findMany({
      where: { userId },
      include: { messages: true },
    });
    zip.file('ai-conversations.json', JSON.stringify(aiConversations, null, 2));

    // Generate ZIP
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    // In production: Upload to S3 with presigned URL
    // For now, return mock URL
    const downloadUrl = `https://neurokind.com/api/exports/${userId}/${Date.now()}.zip`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return { downloadUrl, expiresAt };
  }
}
