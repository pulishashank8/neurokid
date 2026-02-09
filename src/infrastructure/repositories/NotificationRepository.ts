import { injectable, inject } from 'tsyringe';
import { PrismaClient, Notification as PrismaNotification, Prisma } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { INotificationRepository, CreateNotificationInput, ListNotificationsQuery } from '@/domain/interfaces/repositories/INotificationRepository';
import { Notification, NotificationType, PaginatedResult } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';
import { normalizeLimit } from '@/lib/validation';

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
    const limit = normalizeLimit(query.limit);
    const take = limit + 1;

    const where: Prisma.NotificationWhereInput = {
      userId: query.userId,
    };

    if (query.unreadOnly) {
      where.readAt = null;
    }
    if (query.type) {
      where.type = query.type;
    }

    // Support both cursor and offset pagination
    const findManyArgs: Prisma.NotificationFindManyArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      take,
    };

    if (query.cursor) {
      // Cursor-based pagination (preferred)
      findManyArgs.cursor = { id: query.cursor };
      findManyArgs.skip = 1;
    } else if (query.offset !== undefined) {
      // Offset pagination (backward compatibility)
      findManyArgs.skip = query.offset;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany(findManyArgs),
      query.cursor ? Promise.resolve(0) : this.prisma.notification.count({ where }),
    ]);

    const hasMore = notifications.length > limit;
    const data = notifications.slice(0, limit);

    return {
      data: data.map(n => this.toDomain(n)),
      pagination: {
        total: query.cursor ? 0 : total,
        limit,
        offset: query.offset || 0,
        hasMore,
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
