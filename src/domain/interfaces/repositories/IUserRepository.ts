import { User, Profile, Role } from '@/domain/types';

export interface CreateUserInput {
  email: string;
  hashedPassword: string;
  emailVerified?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  hashedPassword?: string;
  emailVerified?: boolean;
  isBanned?: boolean;
  bannedReason?: string;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByIdWithProfile(id: string): Promise<{ user: User; profile: Profile | null } | null>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
  exists(email: string): Promise<boolean>;
  addRole(userId: string, role: Role): Promise<void>;
  removeRole(userId: string, role: Role): Promise<void>;
  getRoles(userId: string): Promise<Role[]>;
  getHashedPassword(userId: string): Promise<string | null>;
}
