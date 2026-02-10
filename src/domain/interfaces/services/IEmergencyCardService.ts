export interface CreateEmergencyCardInput {
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

export interface EmergencyCardDTO {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmergencyCardService {
  create(userId: string, input: CreateEmergencyCardInput): Promise<EmergencyCardDTO>;
  update(id: string, userId: string, input: UpdateEmergencyCardInput): Promise<EmergencyCardDTO>;
  list(userId: string): Promise<EmergencyCardDTO[]>;
  getById(id: string, userId: string): Promise<EmergencyCardDTO | null>;
  delete(id: string, userId: string): Promise<void>;
}
