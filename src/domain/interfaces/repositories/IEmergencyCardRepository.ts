import { EmergencyCard } from '@/domain/types';

export interface CreateEmergencyCardInput {
  userId: string;
  childName: string;
  childAge?: number;
  diagnosis?: string;
  triggers?: string;
  calmingStrategies?: string;
  communication?: string;
  medications?: string;
  allergies?: string;
  emergencyContact1Name?: string;
  emergencyContact1Phone?: string;
  emergencyContact2Name?: string;
  emergencyContact2Phone?: string;
  doctorName?: string;
  doctorPhone?: string;
  additionalNotes?: string;
}

export interface UpdateEmergencyCardInput {
  childName?: string;
  childAge?: number;
  diagnosis?: string;
  triggers?: string;
  calmingStrategies?: string;
  communication?: string;
  medications?: string;
  allergies?: string;
  emergencyContact1Name?: string;
  emergencyContact1Phone?: string;
  emergencyContact2Name?: string;
  emergencyContact2Phone?: string;
  doctorName?: string;
  doctorPhone?: string;
  additionalNotes?: string;
}

export interface IEmergencyCardRepository {
  findById(id: string): Promise<EmergencyCard | null>;
  findByIdAndUser(id: string, userId: string): Promise<EmergencyCard | null>;
  findAllByUser(userId: string): Promise<EmergencyCard[]>;
  create(data: CreateEmergencyCardInput): Promise<EmergencyCard>;
  update(id: string, userId: string, data: UpdateEmergencyCardInput): Promise<EmergencyCard>;
  delete(id: string, userId: string): Promise<void>;
  countByUser(userId: string): Promise<number>;
}
