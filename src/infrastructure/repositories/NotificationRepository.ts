import { injectable, inject } from 'tsyringe';
import { PrismaClient, Notification as PrismaNotification, Prisma } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { INotificationRepository, CreateNotificationInput, ListNotificationsQuery } from '@/domain/interfaces/repositories/INotificationRepository';
import { Notification, NotificationType, PaginatedResult } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class NotificationRepository implements INotificationRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    return notification ? this.toDomain(notification) : null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    return notification ? this.toDomain(notification) : null;
  }

  async list(query: ListNotificationsQuery): Promise<PaginatedResult<Notification>> {
    const where: Prisma.NotificationWhereInput = {
      userId: query.userId,
    };

    if (query.unreadOnly) {
      where.readAt = null;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications.map(n => this.toDomain(n)),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + notifications.length < total,
      },
    };
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        payload: data.payload as Prisma.JsonObject,
      },
    });
    return this.toDomain(notification);
  }

  async createMany(data: CreateNotificationInput[]): Promise<void> {
    await this.prisma.notification.createMany({
      data: data.map(d => ({
        userId: d.userId,
        type: d.type,
        payload: d.payload as Prisma.JsonObject,
      })),
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id, userId },
    });
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        readAt: { not: null },
      },
    });
    return result.count;
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  private toDomain(notification: PrismaNotification): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      payload: notification.payload as Record<string, unknown>,
      readAt: notification.readAt ?? undefined,
      createdAt: notification.createdAt,
    };
  }
}
