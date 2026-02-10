import { Profile } from '@/domain/types';

export interface CreateProfileInput {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  website?: string;
}

export interface UpdateProfileInput {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  website?: string;
  verifiedTherapist?: boolean;
  shadowbanned?: boolean;
}

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  findByUsername(username: string): Promise<Profile | null>;
  create(data: CreateProfileInput): Promise<Profile>;
  update(id: string, data: UpdateProfileInput): Promise<Profile>;
  updateByUserId(userId: string, data: UpdateProfileInput): Promise<Profile>;
  delete(id: string): Promise<void>;
  usernameExists(username: string, excludeUserId?: string): Promise<boolean>;
}
