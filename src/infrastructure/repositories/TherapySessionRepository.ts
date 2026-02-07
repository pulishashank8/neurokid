import { injectable, inject } from 'tsyringe';
import { PrismaClient, TherapySession as PrismaTherapySession, Prisma } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { ITherapySessionRepository, CreateTherapySessionInput, UpdateTherapySessionInput, ListTherapySessionsQuery } from '@/domain/interfaces/repositories/ITherapySessionRepository';
import { TherapySession, TherapyType, PaginatedResult } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class TherapySessionRepository implements ITherapySessionRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<TherapySession | null> {
    const session = await this.prisma.therapySession.findUnique({
      where: { id },
    });
    return session ? this.toDomain(session) : null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<TherapySession | null> {
    const session = await this.prisma.therapySession.findFirst({
      where: { id, userId },
    });
    return session ? this.toDomain(session) : null;
  }

  async list(query: ListTherapySessionsQuery): Promise<PaginatedResult<TherapySession>> {
    const where: Prisma.TherapySessionWhereInput = {
      userId: query.userId,
    };

    if (query.childName) where.childName = query.childName;
    if (query.therapyType) where.therapyType = query.therapyType;
    if (query.startDate || query.endDate) {
      where.sessionDate = {};
      if (query.startDate) where.sessionDate.gte = query.startDate;
      if (query.endDate) where.sessionDate.lte = query.endDate;
    }

    const [sessions, total] = await Promise.all([
      this.prisma.therapySession.findMany({
        where,
        orderBy: { sessionDate: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.therapySession.count({ where }),
    ]);

    return {
      data: sessions.map(s => this.toDomain(s)),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + sessions.length < total,
      },
    };
  }

  async create(data: CreateTherapySessionInput): Promise<TherapySession> {
    const session = await this.prisma.therapySession.create({
      data: {
        userId: data.userId,
        childName: data.childName,
        therapistName: data.therapistName,
        therapyType: data.therapyType,
        sessionDate: data.sessionDate,
        duration: data.duration ?? 60,
        notes: data.notes,
        wentWell: data.wentWell,
        toWorkOn: data.toWorkOn,
        mood: data.mood,
      },
    });
    return this.toDomain(session);
  }

  async update(id: string, userId: string, data: UpdateTherapySessionInput): Promise<TherapySession> {
    const updateData: Prisma.TherapySessionUpdateInput = {};

    if (data.childName !== undefined) updateData.childName = data.childName;
    if (data.therapistName !== undefined) updateData.therapistName = data.therapistName;
    if (data.therapyType !== undefined) updateData.therapyType = data.therapyType;
    if (data.sessionDate !== undefined) updateData.sessionDate = data.sessionDate;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.wentWell !== undefined) updateData.wentWell = data.wentWell;
    if (data.toWorkOn !== undefined) updateData.toWorkOn = data.toWorkOn;
    if (data.mood !== undefined) updateData.mood = data.mood;

    const session = await this.prisma.therapySession.update({
      where: { id, userId },
      data: updateData,
    });
    return this.toDomain(session);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.therapySession.delete({
      where: { id, userId },
    });
  }

  async getChildNames(userId: string): Promise<string[]> {
    const results = await this.prisma.therapySession.findMany({
      where: { userId },
      select: { childName: true },
      distinct: ['childName'],
      orderBy: { childName: 'asc' },
    });
    return results.map(r => r.childName);
  }

  async getTherapistNames(userId: string): Promise<string[]> {
    const results = await this.prisma.therapySession.findMany({
      where: { userId },
      select: { therapistName: true },
      distinct: ['therapistName'],
      orderBy: { therapistName: 'asc' },
    });
    return results.map(r => r.therapistName);
  }

  private toDomain(session: PrismaTherapySession): TherapySession {
    return {
      id: session.id,
      userId: session.userId,
      childName: session.childName,
      therapistName: session.therapistName,
      therapyType: session.therapyType as TherapyType,
      sessionDate: session.sessionDate,
      duration: session.duration,
      notes: session.notes ?? undefined,
      wentWell: session.wentWell ?? undefined,
      toWorkOn: session.toWorkOn ?? undefined,
      mood: session.mood ?? undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
