import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    errorFormat: "pretty",
    datasourceUrl: process.env.DATABASE_URL,
  });

// Cache Prisma client in both development AND production
globalForPrisma.prisma = prisma;

// Default export for compatibility
export default prisma;
