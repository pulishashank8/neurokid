import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface IDatabaseConnection {
  getClient(): PrismaClient;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

// Global instance to prevent multiple connections in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

@injectable()
export class DatabaseConnection implements IDatabaseConnection {
  private client: PrismaClient;

  constructor() {
    if (globalForPrisma.prisma) {
      this.client = globalForPrisma.prisma;
    } else {
      this.client = new PrismaClient({
        datasources: {
          db: {
            url: this.buildConnectionUrl(),
          },
        },
        log: process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
      });

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = this.client;
      }
    }
  }

  private buildConnectionUrl(): string {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Add connection pool settings if not already present
    const separator = baseUrl.includes('?') ? '&' : '?';
    const hasPoolSettings = baseUrl.includes('connection_limit') || baseUrl.includes('pool_timeout');

    if (hasPoolSettings) {
      return baseUrl;
    }

    return `${baseUrl}${separator}connection_limit=5&pool_timeout=10`;
  }

  getClient(): PrismaClient {
    return this.client;
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
    if (globalForPrisma.prisma === this.client) {
      globalForPrisma.prisma = undefined;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
