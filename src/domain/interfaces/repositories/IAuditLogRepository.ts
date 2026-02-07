import { AuditLog, PaginatedResult } from '@/domain/types';

export interface CreateAuditLogInput {
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ListAuditLogsQuery {
  userId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogInput): Promise<AuditLog>;
  list(query: ListAuditLogsQuery): Promise<PaginatedResult<AuditLog>>;
  findByTarget(targetType: string, targetId: string): Promise<AuditLog[]>;
  deleteOlderThan(days: number): Promise<number>;
}
