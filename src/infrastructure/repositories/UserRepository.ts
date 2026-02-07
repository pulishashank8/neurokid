import { injectable, inject } from 'tsyringe';
import { PrismaClient, User as PrismaUser, Profile as PrismaProfile, UserRole as PrismaUserRole } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IUserRepository, CreateUserInput, UpdateUserInput } from '@/domain/interfaces/repositories/IUserRepository';
import { User, Profile, Role } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

type UserWithRoles = PrismaUser & { userRoles: PrismaUserRole[] };
type UserWithRolesAndProfile = UserWithRoles & { profile: PrismaProfile | null };

@injectable()
export class UserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: true },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { userRoles: true },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        user: {
          include: { userRoles: true },
        },
      },
    });
    return profile?.user ? this.toDomain(profile.user) : null;
  }

  async findByIdWithProfile(id: string): Promise<{ user: User; profile: Profile | null } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
        profile: true,
      },
    });

    if (!user) return null;

    return {
      user: this.toDomain(user),
      profile: user.profile ? this.profileToDomain(user.profile) : null,
    };
  }

  async create(data: CreateUserInput): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        hashedPassword: data.hashedPassword,
        emailVerified: data.emailVerified ?? false,
      },
      include: { userRoles: true },
    });
    return this.toDomain(user);
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const updateData: Record<string, unknown> = {};

    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.hashedPassword !== undefined) updateData.hashedPassword = data.hashedPassword;
    if (data.emailVerified !== undefined) {
      updateData.emailVerified = data.emailVerified;
      if (data.emailVerified) {
        updateData.emailVerifiedAt = new Date();
      }
    }
    if (data.isBanned !== undefined) {
      updateData.isBanned = data.isBanned;
      updateData.bannedAt = data.isBanned ? new Date() : null;
    }
    if (data.bannedReason !== undefined) updateData.bannedReason = data.bannedReason;
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt;
    if (data.lastActiveAt !== undefined) updateData.lastActiveAt = data.lastActiveAt;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { userRoles: true },
    });
    return this.toDomain(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email: email.toLowerCase() } });
    return count > 0;
  }

  async addRole(userId: string, role: Role): Promise<void> {
    await this.prisma.userRole.upsert({
      where: {
        userId_role: { userId, role },
      },
      create: { userId, role },
      update: {},
    });
  }

  async removeRole(userId: string, role: Role): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: { userId, role },
    });
  }

  async getRoles(userId: string): Promise<Role[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });
    return roles.map(r => r.role as Role);
  }

  async getHashedPassword(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true },
    });
    return user?.hashedPassword ?? null;
  }

  private toDomain(user: UserWithRoles): User {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
      isBanned: user.isBanned,
      bannedReason: user.bannedReason ?? undefined,
      lastLoginAt: user.lastLoginAt ?? undefined,
      lastActiveAt: user.lastActiveAt ?? undefined,
      roles: user.userRoles.map(r => r.role as Role),
    };
  }

  private profileToDomain(profile: PrismaProfile): Profile {
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
