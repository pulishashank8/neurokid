import { NotificationType, PaginatedResult } from '@/domain/types';

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}

export interface ListNotificationsInput {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit: number;
  offset: number;
}

export interface INotificationService {
  create(input: CreateNotificationInput): Promise<NotificationDTO>;
  createMany(inputs: CreateNotificationInput[]): Promise<void>;
  list(userId: string, input: ListNotificationsInput): Promise<PaginatedResult<NotificationDTO>>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  countUnread(userId: string): Promise<number>;

  // High-level notification methods
  notifyPostComment(postAuthorId: string, commenterId: string, postId: string, commentId: string): Promise<void>;
  notifyCommentReply(parentCommentAuthorId: string, replierId: string, postId: string, commentId: string): Promise<void>;
  notifyMention(mentionedUserId: string, mentionerId: string, targetType: 'post' | 'comment', targetId: string): Promise<void>;
}
