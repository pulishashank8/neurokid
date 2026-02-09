/**
 * Therapy Session Repository
 *
 * Handles all database operations for therapy sessions.
 * Implements encryption/decryption at the data layer.
 */

import { injectable, inject } from "tsyringe";
import { PrismaClient, Prisma } from "@prisma/client";
import { TOKENS } from "@/lib/container";
import { IDatabaseConnection } from "../database/DatabaseConnection";
import { FieldEncryption } from "@/lib/encryption";
import type {
  TherapySession,
  CreateTherapySessionInput,
  UpdateTherapySessionInput,
  TherapySessionFilters,
} from "@/domain/therapy-session.types";

@injectable()
export class TherapySessionRepository {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 100;
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  /**
   * Create new therapy session with encrypted PHI
   */
  async create(
    input: CreateTherapySessionInput
  ): Promise<TherapySession> {
    const data: Prisma.TherapySessionCreateInput = {
      userId: input.userId,
      childName: input.childName,
      therapistName: input.therapistName,
      therapyType: input.therapyType,
      sessionDate: input.sessionDate,
      duration: input.duration ?? 60,
      // Encrypt PHI fields
      notes: FieldEncryption.encrypt(input.notes),
      wentWell: FieldEncryption.encrypt(input.wentWell),
      toWorkOn: FieldEncryption.encrypt(input.toWorkOn),
      mood: input.mood ?? null,
    };

    const session = await this.prisma.therapySession.create({ data });
    return this.decryptSession(session);
  }

  /**
   * Find session by ID only (no ownership check)
   */
  async findById(id: string): Promise<TherapySession | null> {
    const session = await this.prisma.therapySession.findUnique({
      where: { id },
    });

    if (!session) return null;
    return this.decryptSession(session);
  }

  /**
   * Find session by ID with ownership verification
   */
  async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<TherapySession | null> {
    const session = await this.prisma.therapySession.findFirst({
      where: {
        id,
        userId, // Enforce ownership at DB level
      },
    });

    if (!session) return null;
    return this.decryptSession(session);
  }

  /**
   * Find sessions by user with optional filters
   */
  async findByUserId(
    userId: string,
    filters?: TherapySessionFilters
  ): Promise<TherapySession[]> {
    const limit = Math.min(
      filters?.limit ?? TherapySessionRepository.DEFAULT_LIMIT,
      TherapySessionRepository.MAX_LIMIT
    );

    const where: Prisma.TherapySessionWhereInput = { userId };

    if (filters?.childName) {
      where.childName = {
        equals: filters.childName,
        mode: "insensitive",
      };
    }

    if (filters?.therapyType) {
      where.therapyType = filters.therapyType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.sessionDate = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    const sessions = await this.prisma.therapySession.findMany({
      where,
      orderBy: { sessionDate: "desc" },
      take: limit,
      skip: filters?.offset ?? 0,
    });

    return sessions.map((s) => this.decryptSession(s));
  }

  /**
   * List sessions with pagination (alias to match interface)
   */
  async list(query: {
    userId: string;
    childName?: string;
    therapyType?: string;
    startDate?: Date;
    endDate?: Date;
    limit: number;
    offset: number;
  }): Promise<{ data: TherapySession[]; pagination: { total: number; limit: number; offset: number } }> {
    const sessions = await this.findByUserId(query.userId, query);
    const total = await this.countByUserId(query.userId, {
      childName: query.childName,
      therapyType: query.therapyType as any,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      data: sessions,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  }

  /**
   * Update session with ownership verification
   */
  async update(
    id: string,
    userId: string,
    input: UpdateTherapySessionInput
  ): Promise<TherapySession | null> {
    // First verify ownership
    const existing = await this.prisma.therapySession.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    const data: Prisma.TherapySessionUpdateInput = {};

    if (input.childName !== undefined) data.childName = input.childName;
    if (input.therapistName !== undefined)
      data.therapistName = input.therapistName;
    if (input.therapyType !== undefined) data.therapyType = input.therapyType;
    if (input.sessionDate !== undefined) data.sessionDate = input.sessionDate;
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.mood !== undefined) data.mood = input.mood;

    // Encrypt PHI fields if provided
    if (input.notes !== undefined) {
      data.notes = FieldEncryption.encrypt(input.notes);
    }
    if (input.wentWell !== undefined) {
      data.wentWell = FieldEncryption.encrypt(input.wentWell);
    }
    if (input.toWorkOn !== undefined) {
      data.toWorkOn = FieldEncryption.encrypt(input.toWorkOn);
    }

    const updated = await this.prisma.therapySession.update({
      where: { id },
      data,
    });

    return this.decryptSession(updated);
  }

  /**
   * Delete session with ownership verification
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.therapySession.deleteMany({
      where: { id, userId },
    });

    return result.count > 0;
  }

  /**
   * Count sessions for a user (for pagination)
   */
  async countByUserId(
    userId: string,
    filters?: Omit<TherapySessionFilters, "limit" | "offset">
  ): Promise<number> {
    const where: Prisma.TherapySessionWhereInput = { userId };

    if (filters?.childName) {
      where.childName = { equals: filters.childName, mode: "insensitive" };
    }
    if (filters?.therapyType) {
      where.therapyType = filters.therapyType;
    }

    return this.prisma.therapySession.count({ where });
  }

  /**
   * Get all unique child names for a user
   */
  async getChildNames(userId: string): Promise<string[]> {
    const sessions = await this.prisma.therapySession.findMany({
      where: { userId },
      select: { childName: true },
      distinct: ['childName'],
      orderBy: { childName: 'asc' },
    });

    return sessions.map(s => s.childName);
  }

  /**
   * Get all unique therapist names for a user
   */
  async getTherapistNames(userId: string): Promise<string[]> {
    const sessions = await this.prisma.therapySession.findMany({
      where: { userId },
      select: { therapistName: true },
      distinct: ['therapistName'],
      orderBy: { therapistName: 'asc' },
    });

    return sessions.map(s => s.therapistName);
  }

  /**
   * Decrypt session fields after retrieval
   */
  private decryptSession(
    session: Prisma.TherapySessionGetPayload<true>
  ): TherapySession {
    return {
      ...session,
      notes: FieldEncryption.decrypt(session.notes),
      wentWell: FieldEncryption.decrypt(session.wentWell),
      toWorkOn: FieldEncryption.decrypt(session.toWorkOn),
    };
  }
}
