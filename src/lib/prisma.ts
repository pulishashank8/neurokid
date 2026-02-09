import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Configure connection pool limits
 *
 * Configurable via environment variables:
 * - DATABASE_POOL_SIZE: Number of connections (default: 10, max: 20 for serverless)
 * - DATABASE_POOL_TIMEOUT: Connection timeout in seconds (default: 10)
 * - DATABASE_QUERY_TIMEOUT: Query timeout in seconds (default: 5)
 */
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Get configurable pool settings with sensible defaults
  const poolSize = Math.min(
    parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    20 // Max 20 for serverless environments like Supabase
  );
  const poolTimeout = parseInt(process.env.DATABASE_POOL_TIMEOUT || '10', 10);
  const queryTimeout = parseInt(process.env.DATABASE_QUERY_TIMEOUT || '5', 10);

  // Add connection pool parameters for serverless
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}connection_limit=${poolSize}&pool_timeout=${poolTimeout}&statement_timeout=${queryTimeout}s`;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    errorFormat: "pretty",
    datasourceUrl: getDatabaseUrl(),
  });

// Cache Prisma client in both development AND production
globalForPrisma.prisma = prisma;

// Default export for compatibility
export default prisma;
