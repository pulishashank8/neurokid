import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IEmergencyCardService, CreateEmergencyCardInput, UpdateEmergencyCardInput, EmergencyCardDTO } from '@/domain/interfaces/services/IEmergencyCardService';
import { IEmergencyCardRepository } from '@/domain/interfaces/repositories/IEmergencyCardRepository';
import { ValidationError, NotFoundError, BusinessRuleError } from '@/domain/errors';
import { EmergencyCard } from '@/domain/types';
import { sanitizationService } from '@/lib/sanitization';

const MAX_CARDS_PER_USER = 10;

@injectable()
export class EmergencyCardService implements IEmergencyCardService {
  constructor(
    @inject(TOKENS.EmergencyCardRepository) private cardRepo: IEmergencyCardRepository
  ) {}

  async create(userId: string, input: CreateEmergencyCardInput): Promise<EmergencyCardDTO> {
    // Check limit
    const count = await this.cardRepo.countByUser(userId);
    if (count >= MAX_CARDS_PER_USER) {
      throw new BusinessRuleError(
        `Maximum ${MAX_CARDS_PER_USER} emergency cards per user`,
        'MAX_CARDS_EXCEEDED'
      );
    }

    // Validate required fields
    if (!input.childName || input.childName.trim().length < 1) {
      throw new ValidationError('Child name is required', { childName: 'Required' });
    }

    // Validate age if provided
    if (input.childAge !== undefined && (input.childAge < 0 || input.childAge > 30)) {
      throw new ValidationError('Child age must be between 0 and 30', { childAge: 'Invalid range' });
    }

    // Validate phone numbers if provided
    const phoneFields = [
      { field: 'emergencyContact1Phone', value: input.emergencyContact1Phone },
      { field: 'emergencyContact2Phone', value: input.emergencyContact2Phone },
      { field: 'doctorPhone', value: input.doctorPhone },
    ];

    for (const { field, value } of phoneFields) {
      if (value && !this.isValidPhone(value)) {
        throw new ValidationError(`Invalid phone number for ${field}`, { [field]: 'Invalid format' });
      }
    }

    // Sanitize all text fields to prevent XSS
    const card = await this.cardRepo.create({
      userId,
      childName: sanitizationService.sanitizeText(input.childName.trim()),
      childAge: input.childAge,
      diagnosis: input.diagnosis ? sanitizationService.sanitizeContent(input.diagnosis.trim()) : undefined,
      triggers: input.triggers ? sanitizationService.sanitizeContent(input.triggers.trim()) : undefined,
      calmingStrategies: input.calmingStrategies ? sanitizationService.sanitizeContent(input.calmingStrategies.trim()) : undefined,
      communication: input.communication ? sanitizationService.sanitizeContent(input.communication.trim()) : undefined,
      medications: input.medications ? sanitizationService.sanitizeContent(input.medications.trim()) : undefined,
      allergies: input.allergies ? sanitizationService.sanitizeContent(input.allergies.trim()) : undefined,
      emergencyContact1Name: input.emergencyContact1Name ? sanitizationService.sanitizeText(input.emergencyContact1Name.trim()) : undefined,
      emergencyContact1Phone: input.emergencyContact1Phone?.trim(),
      emergencyContact2Name: input.emergencyContact2Name ? sanitizationService.sanitizeText(input.emergencyContact2Name.trim()) : undefined,
      emergencyContact2Phone: input.emergencyContact2Phone?.trim(),
      doctorName: input.doctorName ? sanitizationService.sanitizeText(input.doctorName.trim()) : undefined,
      doctorPhone: input.doctorPhone?.trim(),
      additionalNotes: input.additionalNotes ? sanitizationService.sanitizeContent(input.additionalNotes.trim()) : undefined,
    });

    return this.toDTO(card);
  }

  async update(id: string, userId: string, input: UpdateEmergencyCardInput): Promise<EmergencyCardDTO> {
    const existing = await this.cardRepo.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Emergency card', id);
    }

    // Validate fields if provided
    if (input.childName !== undefined && input.childName.trim().length < 1) {
      throw new ValidationError('Child name cannot be empty', { childName: 'Required' });
    }

    if (input.childAge !== undefined && (input.childAge < 0 || input.childAge > 30)) {
      throw new ValidationError('Child age must be between 0 and 30', { childAge: 'Invalid range' });
    }

    const phoneFields = [
      { field: 'emergencyContact1Phone', value: input.emergencyContact1Phone },
      { field: 'emergencyContact2Phone', value: input.emergencyContact2Phone },
      { field: 'doctorPhone', value: input.doctorPhone },
    ];

    for (const { field, value } of phoneFields) {
      if (value !== undefined && value !== '' && !this.isValidPhone(value)) {
        throw new ValidationError(`Invalid phone number for ${field}`, { [field]: 'Invalid format' });
      }
    }

    // Sanitize all text fields to prevent XSS
    const card = await this.cardRepo.update(id, userId, {
      childName: input.childName ? sanitizationService.sanitizeText(input.childName.trim()) : undefined,
      childAge: input.childAge,
      diagnosis: input.diagnosis !== undefined ? sanitizationService.sanitizeContent(input.diagnosis.trim()) : undefined,
      triggers: input.triggers !== undefined ? sanitizationService.sanitizeContent(input.triggers.trim()) : undefined,
      calmingStrategies: input.calmingStrategies !== undefined ? sanitizationService.sanitizeContent(input.calmingStrategies.trim()) : undefined,
      communication: input.communication !== undefined ? sanitizationService.sanitizeContent(input.communication.trim()) : undefined,
      medications: input.medications !== undefined ? sanitizationService.sanitizeContent(input.medications.trim()) : undefined,
      allergies: input.allergies !== undefined ? sanitizationService.sanitizeContent(input.allergies.trim()) : undefined,
      emergencyContact1Name: input.emergencyContact1Name !== undefined ? sanitizationService.sanitizeText(input.emergencyContact1Name.trim()) : undefined,
      emergencyContact1Phone: input.emergencyContact1Phone?.trim(),
      emergencyContact2Name: input.emergencyContact2Name !== undefined ? sanitizationService.sanitizeText(input.emergencyContact2Name.trim()) : undefined,
      emergencyContact2Phone: input.emergencyContact2Phone?.trim(),
      doctorName: input.doctorName !== undefined ? sanitizationService.sanitizeText(input.doctorName.trim()) : undefined,
      doctorPhone: input.doctorPhone?.trim(),
      additionalNotes: input.additionalNotes !== undefined ? sanitizationService.sanitizeContent(input.additionalNotes.trim()) : undefined,
    });

    return this.toDTO(card);
  }

  async list(userId: string): Promise<EmergencyCardDTO[]> {
    const cards = await this.cardRepo.findAllByUser(userId);
    return cards.map(c => this.toDTO(c));
  }

  async getById(id: string, userId: string): Promise<EmergencyCardDTO | null> {
    const card = await this.cardRepo.findByIdAndUser(id, userId);
    return card ? this.toDTO(card) : null;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.cardRepo.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Emergency card', id);
    }

    await this.cardRepo.delete(id, userId);
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - allows digits, spaces, dashes, parentheses, and plus sign
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }

  private toDTO(card: EmergencyCard): EmergencyCardDTO {
    return {
      id: card.id,
      childName: card.childName,
      childAge: card.childAge,
      diagnosis: card.diagnosis,
      triggers: card.triggers,
      calmingStrategies: card.calmingStrategies,
      communication: card.communication,
      medications: card.medications,
      allergies: card.allergies,
      emergencyContact1Name: card.emergencyContact1Name,
      emergencyContact1Phone: card.emergencyContact1Phone,
      emergencyContact2Name: card.emergencyContact2Name,
      emergencyContact2Phone: card.emergencyContact2Phone,
      doctorName: card.doctorName,
      doctorPhone: card.doctorPhone,
      additionalNotes: card.additionalNotes,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }
}
