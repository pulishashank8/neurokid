import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { INotificationService, NotificationDTO, CreateNotificationInput, ListNotificationsInput } from '@/domain/interfaces/services/INotificationService';
import { INotificationRepository } from '@/domain/interfaces/repositories/INotificationRepository';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { NotFoundError } from '@/domain/errors';
import { Notification, NotificationType, PaginatedResult } from '@/domain/types';

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject(TOKENS.NotificationRepository) private notificationRepo: INotificationRepository,
    @inject(TOKENS.UserRepository) private userRepo: IUserRepository
  ) {}

  async create(input: CreateNotificationInput): Promise<NotificationDTO> {
    // Verify user exists
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User', input.userId);
    }

    const notification = await this.notificationRepo.create({
      userId: input.userId,
      type: input.type,
      payload: input.payload,
    });

    return this.toDTO(notification);
  }

  async createMany(inputs: CreateNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;

    await this.notificationRepo.createMany(inputs);
  }

  async list(userId: string, input: ListNotificationsInput): Promise<PaginatedResult<NotificationDTO>> {
    const result = await this.notificationRepo.list({
      userId,
      unreadOnly: input.unreadOnly,
      type: input.type,
      limit: Math.min(Math.max(input.limit, 1), 100),
      offset: Math.max(input.offset, 0),
    });

    return {
      data: result.data.map(n => this.toDTO(n)),
      pagination: result.pagination,
    };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findByIdAndUser(id, userId);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    await this.notificationRepo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findByIdAndUser(id, userId);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    await this.notificationRepo.delete(id, userId);
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepo.countUnread(userId);
  }

  async notifyPostComment(postAuthorId: string, commenterId: string, postId: string, commentId: string): Promise<void> {
    // Don't notify if commenting on own post
    if (postAuthorId === commenterId) return;

    // Get commenter info for payload
    const commenter = await this.userRepo.findByIdWithProfile(commenterId);
    if (!commenter) return;

    await this.notificationRepo.create({
      userId: postAuthorId,
      type: 'POST_COMMENT',
      payload: {
        postId,
        commentId,
        commenterId,
        commenterUsername: commenter.profile?.username ?? 'Someone',
      },
    });
  }

  async notifyCommentReply(parentCommentAuthorId: string, replierId: string, postId: string, commentId: string): Promise<void> {
    // Don't notify if replying to own comment
    if (parentCommentAuthorId === replierId) return;

    // Get replier info for payload
    const replier = await this.userRepo.findByIdWithProfile(replierId);
    if (!replier) return;

    await this.notificationRepo.create({
      userId: parentCommentAuthorId,
      type: 'COMMENT_REPLY',
      payload: {
        postId,
        commentId,
        replierId,
        replierUsername: replier.profile?.username ?? 'Someone',
      },
    });
  }

  async notifyMention(mentionedUserId: string, mentionerId: string, targetType: 'post' | 'comment', targetId: string): Promise<void> {
    // Don't notify if mentioning self
    if (mentionedUserId === mentionerId) return;

    // Get mentioner info for payload
    const mentioner = await this.userRepo.findByIdWithProfile(mentionerId);
    if (!mentioner) return;

    await this.notificationRepo.create({
      userId: mentionedUserId,
      type: 'MENTION',
      payload: {
        targetType,
        targetId,
        mentionerId,
        mentionerUsername: mentioner.profile?.username ?? 'Someone',
      },
    });
  }

  private toDTO(notification: Notification): NotificationDTO {
    return {
      id: notification.id,
      type: notification.type,
      payload: notification.payload,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
