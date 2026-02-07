import { injectable, inject } from 'tsyringe';
import { PrismaClient, AuditLog as PrismaAuditLog, Prisma } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IAuditLogRepository, CreateAuditLogInput, ListAuditLogsQuery } from '@/domain/interfaces/repositories/IAuditLogRepository';
import { AuditLog, PaginatedResult } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class AuditLogRepository implements IAuditLogRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async create(data: CreateAuditLogInput): Promise<AuditLog> {
    const log = await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        changes: data.changes as Prisma.JsonObject | undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    return this.toDomain(log);
  }

  async list(query: ListAuditLogsQuery): Promise<PaginatedResult<AuditLog>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.targetType) where.targetType = query.targetType;
    if (query.targetId) where.targetId = query.targetId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map(l => this.toDomain(l)),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + logs.length < total,
      },
    };
  }

  async findByTarget(targetType: string, targetId: string): Promise<AuditLog[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map(l => this.toDomain(l));
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
    return result.count;
  }

  private toDomain(log: PrismaAuditLog): AuditLog {
    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      targetType: log.targetType ?? undefined,
      targetId: log.targetId ?? undefined,
      changes: log.changes as Record<string, unknown> | undefined,
      ipAddress: log.ipAddress ?? undefined,
      userAgent: log.userAgent ?? undefined,
      createdAt: log.createdAt,
    };
  }
}
