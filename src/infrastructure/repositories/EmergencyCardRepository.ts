import { injectable, inject } from 'tsyringe';
import { PrismaClient, EmergencyCard as PrismaEmergencyCard } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IEmergencyCardRepository, CreateEmergencyCardInput, UpdateEmergencyCardInput } from '@/domain/interfaces/repositories/IEmergencyCardRepository';
import { EmergencyCard } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class EmergencyCardRepository implements IEmergencyCardRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<EmergencyCard | null> {
    const card = await this.prisma.emergencyCard.findUnique({
      where: { id },
    });
    return card ? this.toDomain(card) : null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<EmergencyCard | null> {
    const card = await this.prisma.emergencyCard.findFirst({
      where: { id, userId },
    });
    return card ? this.toDomain(card) : null;
  }

  async findAllByUser(userId: string): Promise<EmergencyCard[]> {
    const cards = await this.prisma.emergencyCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return cards.map(c => this.toDomain(c));
  }

  async create(data: CreateEmergencyCardInput): Promise<EmergencyCard> {
    const card = await this.prisma.emergencyCard.create({
      data: {
        userId: data.userId,
        childName: data.childName,
        childAge: data.childAge,
        diagnosis: data.diagnosis,
        triggers: data.triggers,
        calmingStrategies: data.calmingStrategies,
        communication: data.communication,
        medications: data.medications,
        allergies: data.allergies,
        emergencyContact1Name: data.emergencyContact1Name,
        emergencyContact1Phone: data.emergencyContact1Phone,
        emergencyContact2Name: data.emergencyContact2Name,
        emergencyContact2Phone: data.emergencyContact2Phone,
        doctorName: data.doctorName,
        doctorPhone: data.doctorPhone,
        additionalNotes: data.additionalNotes,
      },
    });
    return this.toDomain(card);
  }

  async update(id: string, userId: string, data: UpdateEmergencyCardInput): Promise<EmergencyCard> {
    const card = await this.prisma.emergencyCard.update({
      where: { id, userId },
      data: {
        ...(data.childName !== undefined && { childName: data.childName }),
        ...(data.childAge !== undefined && { childAge: data.childAge }),
        ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis }),
        ...(data.triggers !== undefined && { triggers: data.triggers }),
        ...(data.calmingStrategies !== undefined && { calmingStrategies: data.calmingStrategies }),
        ...(data.communication !== undefined && { communication: data.communication }),
        ...(data.medications !== undefined && { medications: data.medications }),
        ...(data.allergies !== undefined && { allergies: data.allergies }),
        ...(data.emergencyContact1Name !== undefined && { emergencyContact1Name: data.emergencyContact1Name }),
        ...(data.emergencyContact1Phone !== undefined && { emergencyContact1Phone: data.emergencyContact1Phone }),
        ...(data.emergencyContact2Name !== undefined && { emergencyContact2Name: data.emergencyContact2Name }),
        ...(data.emergencyContact2Phone !== undefined && { emergencyContact2Phone: data.emergencyContact2Phone }),
        ...(data.doctorName !== undefined && { doctorName: data.doctorName }),
        ...(data.doctorPhone !== undefined && { doctorPhone: data.doctorPhone }),
        ...(data.additionalNotes !== undefined && { additionalNotes: data.additionalNotes }),
      },
    });
    return this.toDomain(card);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.emergencyCard.delete({
      where: { id, userId },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.emergencyCard.count({
      where: { userId },
    });
  }

  private toDomain(card: PrismaEmergencyCard): EmergencyCard {
    return {
      id: card.id,
      userId: card.userId,
      childName: card.childName,
      childAge: card.childAge ?? undefined,
      diagnosis: card.diagnosis ?? undefined,
      triggers: card.triggers ?? undefined,
      calmingStrategies: card.calmingStrategies ?? undefined,
      communication: card.communication ?? undefined,
      medications: card.medications ?? undefined,
      allergies: card.allergies ?? undefined,
      emergencyContact1Name: card.emergencyContact1Name ?? undefined,
      emergencyContact1Phone: card.emergencyContact1Phone ?? undefined,
      emergencyContact2Name: card.emergencyContact2Name ?? undefined,
      emergencyContact2Phone: card.emergencyContact2Phone ?? undefined,
      doctorName: card.doctorName ?? undefined,
      doctorPhone: card.doctorPhone ?? undefined,
      additionalNotes: card.additionalNotes ?? undefined,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }
}
