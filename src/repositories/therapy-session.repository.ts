/**
 * Therapy Session Repository
 * 
 * Handles all database operations for therapy sessions.
 * Implements encryption/decryption at the data layer.
 */

import { prisma } from "@/lib/prisma";
import { FieldEncryption } from "@/lib/encryption";
import type {
  TherapySession,
  CreateTherapySessionInput,
  UpdateTherapySessionInput,
  TherapySessionFilters,
} from "@/domain/therapy-session.types";
import type { TherapyType, Prisma } from "@prisma/client";

export class TherapySessionRepository {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 100;

  /**
   * Create new therapy session with encrypted PHI
   */
  static async create(
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

    const session = await prisma.therapySession.create({ data });
    return this.decryptSession(session);
  }

  /**
   * Find session by ID with ownership verification
   */
  static async findById(
    id: string,
    userId: string
  ): Promise<TherapySession | null> {
    const session = await prisma.therapySession.findFirst({
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
  static async findByUserId(
    userId: string,
    filters?: TherapySessionFilters
  ): Promise<TherapySession[]> {
    const limit = Math.min(
      filters?.limit ?? this.DEFAULT_LIMIT,
      this.MAX_LIMIT
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

    const sessions = await prisma.therapySession.findMany({
      where,
      orderBy: { sessionDate: "desc" },
      take: limit,
      skip: filters?.offset ?? 0,
    });

    return sessions.map((s) => this.decryptSession(s));
  }

  /**
   * Update session with ownership verification
   */
  static async update(
    id: string,
    userId: string,
    input: UpdateTherapySessionInput
  ): Promise<TherapySession | null> {
    // First verify ownership
    const existing = await prisma.therapySession.findFirst({
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

    const updated = await prisma.therapySession.update({
      where: { id },
      data,
    });

    return this.decryptSession(updated);
  }

  /**
   * Delete session with ownership verification
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await prisma.therapySession.deleteMany({
      where: { id, userId },
    });

    return result.count > 0;
  }

  /**
   * Count sessions for a user (for pagination)
   */
  static async countByUserId(
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

    return prisma.therapySession.count({ where });
  }

  /**
   * Decrypt session fields after retrieval
   */
  private static decryptSession(
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
