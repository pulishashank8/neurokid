import { Role } from '@/domain/types';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  roles: Role[];
  verifiedTherapist: boolean;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  website?: string;
}

export interface IUserService {
  findById(userId: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  findByUsername(username: string): Promise<UserProfile | null>;
  updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile>;
  banUser(userId: string, reason: string, bannedBy: string): Promise<void>;
  unbanUser(userId: string, unbannedBy: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  assignRole(userId: string, role: Role, assignedBy: string): Promise<void>;
  removeRole(userId: string, role: Role, removedBy: string): Promise<void>;
}
