import { injectable, inject } from 'tsyringe';
import { PrismaClient, Profile as PrismaProfile } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IProfileRepository, CreateProfileInput, UpdateProfileInput } from '@/domain/interfaces/repositories/IProfileRepository';
import { Profile } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class ProfileRepository implements IProfileRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    });
    return profile ? this.toDomain(profile) : null;
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    return profile ? this.toDomain(profile) : null;
  }

  async findByUsername(username: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
    });
    return profile ? this.toDomain(profile) : null;
  }

  async create(data: CreateProfileInput): Promise<Profile> {
    const profile = await this.prisma.profile.create({
      data: {
        userId: data.userId,
        username: data.username.toLowerCase(),
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        location: data.location,
        website: data.website,
      },
    });
    return this.toDomain(profile);
  }

  async update(id: string, data: UpdateProfileInput): Promise<Profile> {
    const updateData: Record<string, unknown> = {};

    if (data.username !== undefined) updateData.username = data.username.toLowerCase();
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.verifiedTherapist !== undefined) {
      updateData.verifiedTherapist = data.verifiedTherapist;
      if (data.verifiedTherapist) {
        updateData.verifiedAt = new Date();
      }
    }
    if (data.shadowbanned !== undefined) {
      updateData.shadowbanned = data.shadowbanned;
      updateData.shadowbannedAt = data.shadowbanned ? new Date() : null;
    }

    const profile = await this.prisma.profile.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(profile);
  }

  async updateByUserId(userId: string, data: UpdateProfileInput): Promise<Profile> {
    const updateData: Record<string, unknown> = {};

    if (data.username !== undefined) updateData.username = data.username.toLowerCase();
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.verifiedTherapist !== undefined) {
      updateData.verifiedTherapist = data.verifiedTherapist;
      if (data.verifiedTherapist) {
        updateData.verifiedAt = new Date();
      }
    }
    if (data.shadowbanned !== undefined) {
      updateData.shadowbanned = data.shadowbanned;
      updateData.shadowbannedAt = data.shadowbanned ? new Date() : null;
    }

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: updateData,
    });
    return this.toDomain(profile);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.profile.delete({ where: { id } });
  }

  async usernameExists(username: string, excludeUserId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { username: username.toLowerCase() };
    if (excludeUserId) {
      where.NOT = { userId: excludeUserId };
    }
    const count = await this.prisma.profile.count({ where });
    return count > 0;
  }

  private toDomain(profile: PrismaProfile): Profile {
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      location: profile.location ?? undefined,
      website: profile.website ?? undefined,
      verifiedTherapist: profile.verifiedTherapist,
      shadowbanned: profile.shadowbanned,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
