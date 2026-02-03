/**
 * Therapy Session Domain Types
 */

import type { TherapyType } from "@prisma/client";

export interface TherapySession {
  id: string;
  userId: string;
  childName: string;
  therapistName: string;
  therapyType: TherapyType;
  sessionDate: Date;
  duration: number;
  notes: string | null;
  wentWell: string | null;
  toWorkOn: string | null;
  mood: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTherapySessionInput {
  userId: string;
  childName: string;
  therapistName: string;
  therapyType: TherapyType;
  sessionDate: Date;
  duration?: number;
  notes?: string | null;
  wentWell?: string | null;
  toWorkOn?: string | null;
  mood?: number | null;
}

export interface UpdateTherapySessionInput {
  childName?: string;
  therapistName?: string;
  therapyType?: TherapyType;
  sessionDate?: Date;
  duration?: number;
  notes?: string | null;
  wentWell?: string | null;
  toWorkOn?: string | null;
  mood?: number | null;
}

export interface TherapySessionFilters {
  childName?: string;
  therapyType?: TherapyType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
