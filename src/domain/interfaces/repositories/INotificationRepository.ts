import { Notification, NotificationType, PaginatedResult } from '@/domain/types';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}

export interface ListNotificationsQuery {
  userId: string;
  unreadOnly?: boolean;
  type?: NotificationType;
  limit: number;
  offset: number;
}

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByIdAndUser(id: string, userId: string): Promise<Notification | null>;
  list(query: ListNotificationsQuery): Promise<PaginatedResult<Notification>>;
  create(data: CreateNotificationInput): Promise<Notification>;
  createMany(data: CreateNotificationInput[]): Promise<void>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  deleteOlderThan(days: number): Promise<number>;
  countUnread(userId: string): Promise<number>;
}
