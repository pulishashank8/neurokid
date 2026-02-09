import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { UserService } from '@/application/services/UserService';
import { NotFoundError } from '@/domain/errors';
import {
  createTestContainer,
  resetTestContainer,
  createMockUserRepository,
  createMockProfileRepository,
  createMockAuditLogRepository,
} from '../../utils/test-container';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockProfileRepo: ReturnType<typeof createMockProfileRepository>;
  let mockAuditLogRepo: ReturnType<typeof createMockAuditLogRepository>;

  beforeEach(() => {
    resetTestContainer();
    createTestContainer();

    mockUserRepo = createMockUserRepository();
    mockProfileRepo = createMockProfileRepository();
    mockAuditLogRepo = createMockAuditLogRepository();

    container.register(TOKENS.UserRepository, { useValue: mockUserRepo });
    container.register(TOKENS.ProfileRepository, { useValue: mockProfileRepo });
    container.register(TOKENS.AuditLogRepository, { useValue: mockAuditLogRepo });

    userService = container.resolve(UserService);
  });

  describe('findById', () => {
    it('should return user profile when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        isBanned: false,
        roles: ['PARENT'],
      };

      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'A test user bio',
        verifiedTherapist: false,
        shadowbanned: false,
      };

      mockUserRepo.findByIdWithProfile.mockResolvedValue({
        user: mockUser,
        profile: mockProfile,
      });

      const result = await userService.findById('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'A test user bio',
        avatarUrl: undefined,
        roles: ['PARENT'],
        verifiedTherapist: false,
        createdAt: mockUser.createdAt,
        lastLoginAt: null,
      });

      expect(mockUserRepo.findByIdWithProfile).toHaveBeenCalledWith('user-1');
    });

    it('should return null when user not found', async () => {
      mockUserRepo.findByIdWithProfile.mockResolvedValue(null);

      const result = await userService.findById('nonexistent');

      expect(result).toBeNull();
      expect(mockUserRepo.findByIdWithProfile).toHaveBeenCalledWith('nonexistent');
    });

    it('should return user profile without profile data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        isBanned: false,
        roles: [],
      };

      mockUserRepo.findByIdWithProfile.mockResolvedValue({
        user: mockUser,
        profile: null,
      });

      const result = await userService.findById('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        username: undefined,
        displayName: undefined,
        bio: undefined,
        avatarUrl: undefined,
        roles: [],
        verifiedTherapist: false,
        createdAt: mockUser.createdAt,
        lastLoginAt: null,
      });
    });
  });

  describe('findByEmail', () => {
    it('should return user profile when found by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        isBanned: false,
        roles: ['PARENT'],
      };

      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        verifiedTherapist: false,
        shadowbanned: false,
      };

      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockUserRepo.findByIdWithProfile.mockResolvedValue({
        user: mockUser,
        profile: mockProfile,
      });

      const result = await userService.findByEmail('test@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when email not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const result = await userService.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return user profile when found by username', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        isBanned: false,
        roles: [],
      };

      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        verifiedTherapist: false,
        shadowbanned: false,
      };

      mockUserRepo.findByUsername.mockResolvedValue(mockUser);
      mockUserRepo.findByIdWithProfile.mockResolvedValue({
        user: mockUser,
        profile: mockProfile,
      });

      const result = await userService.findByUsername('testuser');

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
    });

    it('should return null when username not found', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(null);

      const result = await userService.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('banUser', () => {
    it('should ban user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        isBanned: false,
        roles: [],
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue({ ...mockUser, isBanned: true });
      mockAuditLogRepo.create.mockResolvedValue({});

      await userService.banUser('user-1', 'Spam violation', 'admin-1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        isBanned: true,
        bannedReason: 'Spam violation',
      });
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.banUser('nonexistent', 'Spam', 'admin-1'))
        .rejects.toThrow(NotFoundError);

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('unbanUser', () => {
    it('should unban user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        isBanned: true,
        roles: [],
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue({ ...mockUser, isBanned: false });
      mockAuditLogRepo.create.mockResolvedValue({});

      await userService.unbanUser('user-1', 'admin-1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        isBanned: false,
        bannedReason: undefined,
      });
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.unbanUser('nonexistent', 'admin-1'))
        .rejects.toThrow(NotFoundError);

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockUserRepo.update.mockResolvedValue({});

      await userService.updateLastLogin('user-1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        lastLoginAt: expect.any(Date),
        lastActiveAt: expect.any(Date),
      });
    });
  });
});
