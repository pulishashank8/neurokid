import { TherapySession, TherapyType, PaginatedResult } from '@/domain/types';

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

export interface ListTherapySessionsQuery {
  userId: string;
  childName?: string;
  therapyType?: TherapyType;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

export interface ITherapySessionRepository {
  findById(id: string): Promise<TherapySession | null>;
  findByIdAndUser(id: string, userId: string): Promise<TherapySession | null>;
  list(query: ListTherapySessionsQuery): Promise<PaginatedResult<TherapySession>>;
  create(data: CreateTherapySessionInput): Promise<TherapySession>;
  update(id: string, userId: string, data: UpdateTherapySessionInput): Promise<TherapySession>;
  delete(id: string, userId: string): Promise<boolean>;
  getChildNames(userId: string): Promise<string[]>;
  getTherapistNames(userId: string): Promise<string[]>;
}
