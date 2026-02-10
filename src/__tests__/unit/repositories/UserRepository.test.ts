import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { createMockPrismaClient } from '../../utils/mock-prisma';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    container.clearInstances();
    mockPrisma = createMockPrismaClient();
    
    container.register(TOKENS.DatabaseConnection, {
      useValue: {
        getClient: vi.fn().mockReturnValue(mockPrisma),
        getReadClient: vi.fn().mockReturnValue(mockPrisma),
      },
    });

    repository = container.resolve(UserRepository);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: true,
        isBanned: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        userRoles: [{ id: 'ur-1', userId: 'user-1', role: 'USER' }],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('user-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-1');
      expect(result?.email).toBe('test@example.com');
      expect(result?.roles).toContain('USER');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { userRoles: true },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should map multiple roles correctly', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@example.com',
        emailVerified: true,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [
          { id: 'ur-1', userId: 'user-1', role: 'USER' },
          { id: 'ur-2', userId: 'user-1', role: 'ADMIN' },
          { id: 'ur-3', userId: 'user-1', role: 'MODERATOR' },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('user-1');

      expect(result?.roles).toHaveLength(3);
      expect(result?.roles).toContain('USER');
      expect(result?.roles).toContain('ADMIN');
      expect(result?.roles).toContain('MODERATOR');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (case insensitive)', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: true,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('TEST@EXAMPLE.COM');

      expect(result).not.toBeNull();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { userRoles: true },
      });
    });

    it('should return null when email not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username (case insensitive)', async () => {
      const mockProfile = {
        id: 'profile-1',
        username: 'testuser',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          emailVerified: true,
          isBanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userRoles: [{ id: 'ur-1', userId: 'user-1', role: 'USER' }],
        },
      };

      mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.findByUsername('TestUser');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-1');
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        include: {
          user: {
            include: { userRoles: true },
          },
        },
      });
    });

    it('should return null when username not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      const result = await repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when profile has no user', async () => {
      const mockProfile = {
        id: 'profile-1',
        username: 'orphan',
        user: null,
      };

      mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.findByUsername('orphan');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithProfile', () => {
    it('should return user with profile when both exist', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: true,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
        profile: {
          id: 'profile-1',
          userId: 'user-1',
          username: 'testuser',
          displayName: 'Test User',
          bio: 'Test bio',
          avatarUrl: 'avatar.jpg',
          location: 'Test City',
          website: 'https://example.com',
          verifiedTherapist: true,
          shadowbanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByIdWithProfile('user-1');

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe('user-1');
      expect(result?.profile).not.toBeNull();
      expect(result?.profile?.username).toBe('testuser');
      expect(result?.profile?.verifiedTherapist).toBe(true);
    });

    it('should return user with null profile when profile does not exist', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: true,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
        profile: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByIdWithProfile('user-1');

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe('user-1');
      expect(result?.profile).toBeNull();
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithProfile('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user with required fields', async () => {
      const input = {
        email: 'new@example.com',
        hashedPassword: 'hashedpassword123',
      };

      const mockCreatedUser = {
        id: 'new-user-1',
        email: 'new@example.com',
        hashedPassword: 'hashedpassword123',
        emailVerified: false,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await repository.create(input);

      expect(result.id).toBe('new-user-1');
      expect(result.email).toBe('new@example.com');
      expect(result.emailVerified).toBe(false);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          hashedPassword: 'hashedpassword123',
          emailVerified: false,
        },
        include: { userRoles: true },
      });
    });

    it('should create user with emailVerified set to true', async () => {
      const input = {
        email: 'verified@example.com',
        hashedPassword: 'hashedpassword123',
        emailVerified: true,
      };

      const mockCreatedUser = {
        id: 'verified-user-1',
        email: 'verified@example.com',
        hashedPassword: 'hashedpassword123',
        emailVerified: true,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await repository.create(input);

      expect(result.emailVerified).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          emailVerified: true,
        }),
        include: { userRoles: true },
      });
    });
  });

  describe('update', () => {
    it('should update user email (lowercased)', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'updated@example.com',
        hashedPassword: 'oldhash',
        emailVerified: false,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.update('user-1', { email: 'UPDATED@EXAMPLE.COM' });

      expect(result.email).toBe('updated@example.com');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { email: 'updated@example.com' },
        include: { userRoles: true },
      });
    });

    it('should update password', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'newhashedpassword',
        emailVerified: true,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.update('user-1', { hashedPassword: 'newhashedpassword' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { hashedPassword: 'newhashedpassword' },
        include: { userRoles: true },
      });
    });

    it('should set emailVerifiedAt when emailVerified becomes true', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'hash',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await repository.update('user-1', { emailVerified: true });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          emailVerified: true,
          emailVerifiedAt: expect.any(Date),
        }),
        include: { userRoles: true },
      });
    });

    it('should set bannedAt when user is banned', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'hash',
        emailVerified: true,
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: 'Violation of terms',
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await repository.update('user-1', { isBanned: true, bannedReason: 'Violation of terms' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          isBanned: true,
          bannedAt: expect.any(Date),
          bannedReason: 'Violation of terms',
        }),
        include: { userRoles: true },
      });
    });

    it('should clear bannedAt when user is unbanned', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'hash',
        emailVerified: true,
        isBanned: false,
        bannedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await repository.update('user-1', { isBanned: false });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          isBanned: false,
          bannedAt: null,
        }),
        include: { userRoles: true },
      });
    });

    it('should update lastLoginAt', async () => {
      const now = new Date();
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'hash',
        emailVerified: true,
        isBanned: false,
        lastLoginAt: now,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await repository.update('user-1', { lastLoginAt: now });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          lastLoginAt: now,
        }),
        include: { userRoles: true },
      });
    });

    it('should update lastActiveAt', async () => {
      const now = new Date();
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'hash',
        emailVerified: true,
        isBanned: false,
        lastActiveAt: now,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      await repository.update('user-1', { lastActiveAt: now });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          lastActiveAt: now,
        }),
        include: { userRoles: true },
      });
    });

    it('should only include provided fields in update', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'hash',
        emailVerified: true,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userRoles: [],
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      // Only update bannedReason, not isBanned
      await repository.update('user-1', { bannedReason: 'Warning' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { bannedReason: 'Warning' },
        include: { userRoles: true },
      });
    });
  });

  describe('delete', () => {
    it('should delete user by id', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 'user-1' } as any);

      await repository.delete('user-1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await repository.exists('test@example.com');

      expect(result).toBe(true);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return false when user does not exist', async () => {
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await repository.exists('nonexistent@example.com');

      expect(result).toBe(false);
    });

    it('should check email case-insensitively', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      await repository.exists('TEST@EXAMPLE.COM');

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('addRole', () => {
    it('should upsert user role', async () => {
      mockPrisma.userRole.upsert.mockResolvedValue({ id: 'ur-1', userId: 'user-1', role: 'ADMIN' });

      await repository.addRole('user-1', 'ADMIN');

      expect(mockPrisma.userRole.upsert).toHaveBeenCalledWith({
        where: {
          userId_role: { userId: 'user-1', role: 'ADMIN' },
        },
        create: { userId: 'user-1', role: 'ADMIN' },
        update: {},
      });
    });
  });

  describe('removeRole', () => {
    it('should delete user role', async () => {
      mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 1 });

      await repository.removeRole('user-1', 'ADMIN');

      expect(mockPrisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', role: 'ADMIN' },
      });
    });
  });

  describe('getRoles', () => {
    it('should return array of roles for user', async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: 'USER' },
        { role: 'MODERATOR' },
      ]);

      const result = await repository.getRoles('user-1');

      expect(result).toHaveLength(2);
      expect(result).toContain('USER');
      expect(result).toContain('MODERATOR');
      expect(mockPrisma.userRole.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { role: true },
      });
    });

    it('should return empty array when user has no roles', async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([]);

      const result = await repository.getRoles('user-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getHashedPassword', () => {
    it('should return hashed password when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ hashedPassword: 'hashedpass123' });

      const result = await repository.getHashedPassword('user-1');

      expect(result).toBe('hashedpass123');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { hashedPassword: true },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.getHashedPassword('nonexistent');

      expect(result).toBeNull();
    });
  });
});
