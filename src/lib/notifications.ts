/**
 * Helpers to create notifications from API routes (no DI required).
 * Uses Prisma directly so posts, messages, and connection routes can notify users.
 */

import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 500;

/**
 * Notify all users (except author) about a new post. Batched to avoid huge inserts.
 */
export async function notifyNewPost(params: {
  postId: string;
  postTitle: string;
  authorId: string;
  authorUsername?: string;
}): Promise<void> {
  const { postId, postTitle, authorId, authorUsername } = params;
  try {
    const userIds = await prisma.user.findMany({
      where: { id: { not: authorId } },
      select: { id: true },
    });
    const ids = userIds.map((u) => u.id);
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      await prisma.notification.createMany({
        data: batch.map((userId) => ({
          userId,
          type: "NEW_POST",
          payload: {
            postId,
            postTitle: postTitle.slice(0, 100),
            authorId,
            authorUsername: authorUsername ?? "Someone",
          },
        })),
      });
    }
  } catch (err) {
    console.error("[notifications] notifyNewPost failed:", err);
  }
}

/**
 * Notify recipient(s) about a new message (e.g. other participants in the conversation).
 */
export async function notifyMessage(params: {
  conversationId: string;
  messageId: string;
  senderId: string;
  recipientIds: string[];
  contentPreview?: string;
  senderUsername?: string;
}): Promise<void> {
  const { conversationId, messageId, senderId, recipientIds, contentPreview, senderUsername } = params;
  const toNotify = recipientIds.filter((id) => id !== senderId);
  if (toNotify.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: toNotify.map((userId) => ({
        userId,
        type: "MESSAGE",
        payload: {
          conversationId,
          messageId,
          senderId,
          senderUsername: senderUsername ?? "Someone",
          contentPreview: contentPreview?.slice(0, 80) ?? "",
        },
      })),
    });
  } catch (err) {
    console.error("[notifications] notifyMessage failed:", err);
  }
}

/**
 * Notify the receiver about a new connection request.
 */
export async function notifyConnectionRequest(params: {
  requestId: string;
  receiverId: string;
  senderId: string;
  senderUsername?: string;
  senderDisplayName?: string;
  message?: string;
}): Promise<void> {
  const { requestId, receiverId, senderId, senderUsername, senderDisplayName, message } = params;
  try {
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "CONNECTION_REQUEST",
        payload: {
          requestId,
          senderId,
          senderUsername: senderUsername ?? "Someone",
          senderDisplayName: senderDisplayName ?? null,
          message: message ?? null,
        },
      },
    });
  } catch (err) {
    console.error("[notifications] notifyConnectionRequest failed:", err);
  }
}
