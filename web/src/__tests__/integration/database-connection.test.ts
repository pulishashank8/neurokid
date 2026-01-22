import { describe, it, expect } from 'vitest';
import { getTestPrisma } from '../helpers/database';

const prisma = getTestPrisma();

describe('Database Connection Test', () => {
    it('should connect to database successfully', async () => {
        // Simple connection test
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        expect(result).toBeDefined();
    });

    it('should be able to query users table', async () => {
        const users = await prisma.user.findMany({ take: 1 });
        expect(Array.isArray(users)).toBe(true);
    });

    it('should be able to query categories table', async () => {
        const categories = await prisma.category.findMany({ take: 1 });
        expect(Array.isArray(categories)).toBe(true);
    });
});
