import { TherapyType, PaginatedResult } from '@/domain/types';

export interface CreateTherapySessionInput {
  childName: string;
  therapistName: string;
  therapyType: TherapyType;
  sessionDate: Date;
  duration?: number;
  notes?: string;
  wentWell?: string;
  toWorkOn?: string;
  mood?: number;
}

export interface UpdateTherapySessionInput {
  childName?: string;
  therapistName?: string;
  therapyType?: TherapyType;
  sessionDate?: Date;
  duration?: number;
  notes?: string;
  wentWell?: string;
  toWorkOn?: string;
  mood?: number;
}

export interface TherapySessionDTO {
  id: string;
  childName: string;
  therapistName: string;
  therapyType: TherapyType;
  sessionDate: Date;
  duration: number;
  notes?: string;
  wentWell?: string;
  toWorkOn?: string;
  mood?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTherapySessionsInput {
  childName?: string;
  therapyType?: TherapyType;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

export interface ITherapySessionService {
  create(userId: string, input: CreateTherapySessionInput): Promise<TherapySessionDTO>;
  update(id: string, userId: string, input: UpdateTherapySessionInput): Promise<TherapySessionDTO>;
  list(userId: string, input: ListTherapySessionsInput): Promise<PaginatedResult<TherapySessionDTO>>;
  getById(id: string, userId: string): Promise<TherapySessionDTO | null>;
  delete(id: string, userId: string): Promise<void>;
  getChildNames(userId: string): Promise<string[]>;
  getTherapistNames(userId: string): Promise<string[]>;
}
