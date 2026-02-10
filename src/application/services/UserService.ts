import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IUserService, UserProfile, UpdateProfileInput } from '@/domain/interfaces/services/IUserService';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { IProfileRepository } from '@/domain/interfaces/repositories/IProfileRepository';
import { IAuditLogRepository } from '@/domain/interfaces/repositories/IAuditLogRepository';
import { NotFoundError, ForbiddenError } from '@/domain/errors';
import { Role } from '@/domain/types';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TOKENS.UserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.ProfileRepository) private profileRepo: IProfileRepository,
    @inject(TOKENS.AuditLogRepository) private auditRepo: IAuditLogRepository
  ) {}

  async findById(userId: string): Promise<UserProfile | null> {
    const result = await this.userRepo.findByIdWithProfile(userId);
    if (!result) return null;

    return this.toUserProfile(result.user, result.profile);
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;
    return this.findById(user.id);
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) return null;
    return this.findById(user.id);
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile> {
    const result = await this.userRepo.findByIdWithProfile(userId);
    if (!result) {
      throw new NotFoundError('User', userId);
    }

    if (!result.profile) {
      throw new NotFoundError('Profile', userId);
    }

    await this.profileRepo.updateByUserId(userId, {
      displayName: data.displayName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      location: data.location,
      website: data.website,
    });

    const updated = await this.findById(userId);
    if (!updated) {
      throw new NotFoundError('User', userId);
    }

    return updated;
  }

  async banUser(userId: string, reason: string, bannedBy: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    if (user.isBanned) {
      return; // Already banned
    }

    await this.userRepo.update(userId, {
      isBanned: true,
      bannedReason: reason,
    });

    await this.auditRepo.create({
      userId: bannedBy,
      action: 'USER_BANNED',
      targetType: 'USER',
      targetId: userId,
      changes: { reason },
    });
  }

  async unbanUser(userId: string, unbannedBy: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    if (!user.isBanned) {
      return; // Not banned
    }

    await this.userRepo.update(userId, {
      isBanned: false,
      bannedReason: undefined,
    });

    await this.auditRepo.create({
      userId: unbannedBy,
      action: 'USER_UNBANNED',
      targetType: 'USER',
      targetId: userId,
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
    });
  }

  async assignRole(userId: string, role: Role, assignedBy: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    if (user.roles.includes(role)) {
      return; // Already has role
    }

    await this.userRepo.addRole(userId, role);

    await this.auditRepo.create({
      userId: assignedBy,
      action: 'ROLE_ASSIGNED',
      targetType: 'USER',
      targetId: userId,
      changes: { role },
    });
  }

  async removeRole(userId: string, role: Role, removedBy: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    if (!user.roles.includes(role)) {
      return; // Doesn't have role
    }

    await this.userRepo.removeRole(userId, role);

    await this.auditRepo.create({
      userId: removedBy,
      action: 'ROLE_REMOVED',
      targetType: 'USER',
      targetId: userId,
      changes: { role },
    });
  }

  private toUserProfile(user: { id: string; email: string; roles: Role[]; createdAt: Date; lastLoginAt?: Date }, profile: { username: string; displayName: string; bio?: string; avatarUrl?: string; verifiedTherapist: boolean } | null): UserProfile {
    return {
      id: user.id,
      email: user.email,
      username: profile?.username,
      displayName: profile?.displayName,
      bio: profile?.bio,
      avatarUrl: profile?.avatarUrl,
      roles: user.roles,
      verifiedTherapist: profile?.verifiedTherapist ?? false,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt ?? null,
    };
  }
}
