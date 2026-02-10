import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'Database' });

// Slow query threshold in milliseconds (configurable via env)
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '100', 10);

// Connection retry settings
const MAX_RETRIES = parseInt(process.env.DATABASE_MAX_RETRIES || '3', 10);
const RETRY_BASE_DELAY_MS = parseInt(process.env.DATABASE_RETRY_BASE_DELAY_MS || '1000', 10);

export interface ConnectionPoolStats {
  totalQueries: number;
  slowQueries: number;
  errorCount: number;
  lastError?: string;
  lastErrorAt?: Date;
  avgQueryTime: number;
}

export interface IDatabaseConnection {
  getClient(): PrismaClient;
  /**
   * Get read-only client for replica queries (future enhancement)
   * When read replicas are available, this routes to replica for SELECT queries
   */
  getReadClient?(): PrismaClient;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  getPoolStats(): ConnectionPoolStats;
  executeWithRetry<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * READ REPLICA SETUP GUIDE
 * 
 * When database read replicas are available (Supabase/AWS RDS/etc):
 * 
 * 1. Environment Variables:
 *    - DATABASE_URL (primary - writes + critical reads)
 *    - DATABASE_READ_URL (read replica - for SELECT queries)
 *    - DATABASE_READ_REPLICAS_ENABLED=true
 * 
 * 2. Implementation Steps:
 *    a) Add getReadClient() method to return replica connection
 *    b) Implement query routing logic:
 *       - Writes (INSERT/UPDATE/DELETE) → getClient()
 *       - Reads (SELECT) → getReadClient()
 *    c) Add replication lag detection to fallback to primary if lag > threshold
 *    d) Update services to use appropriate client based on operation type
 * 
 * 3. Benefits:
 *    - Distributes read load across multiple database instances
 *    - Implies 2-3x read capacity improvement
 *    - Allows horizontal scaling of read-heavy workloads
 * 
 * 4. Example Usage (future):
 *    const db = container.resolve(DatabaseConnection);
 *    
 *    // Write operation → primary
 *    await db.getClient().post.create({ data: {...} });
 *    
 *    // Read operation → replica
 *    await db.getReadClient().post.findMany({ where: {...} });
 */

// Global instance to prevent multiple connections in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

@injectable()
export class DatabaseConnection implements IDatabaseConnection {
  private client: PrismaClient;
  private readClient: PrismaClient | null = null;
  private stats: ConnectionPoolStats = {
    totalQueries: 0,
    slowQueries: 0,
    errorCount: 0,
    avgQueryTime: 0,
  };
  private queryTimes: number[] = [];
  private static readonly MAX_QUERY_SAMPLES = 100;

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

      // Add query performance monitoring middleware
      this.setupQueryMonitoring();

      // Initialize read replica if configured
      this.initializeReadReplica();

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = this.client;
      }
    }
  }

  /**
   * Initialize read replica connection
   */
  private initializeReadReplica(): void {
    const readUrl = process.env.DATABASE_READ_URL;
    if (readUrl && process.env.DATABASE_READ_REPLICAS_ENABLED === 'true') {
      try {
        this.readClient = new PrismaClient({
          datasources: {
            db: {
              url: readUrl,
            },
          },
          log: ['error'],
        });
        logger.info('Read replica connection initialized');
      } catch (error) {
        logger.warn({ error }, 'Failed to initialize read replica, falling back to primary');
        this.readClient = null;
      }
    }
  }

  /**
   * Get read-only client for replica queries
   * Falls back to primary if replica is not available
   */
  getReadClient(): PrismaClient {
    return this.readClient || this.client;
  }

  /**
   * Set up query performance monitoring
   * Logs slow queries (> SLOW_QUERY_THRESHOLD ms) for performance analysis
   */
  private setupQueryMonitoring(): void {
    this.client.$use(async (params, next) => {
      const startTime = Date.now();

      try {
        const result = await next(params);
        const duration = Date.now() - startTime;

        // Update stats
        this.stats.totalQueries++;
        this.trackQueryTime(duration);

        // Log slow queries
        if (duration > SLOW_QUERY_THRESHOLD) {
          this.stats.slowQueries++;
          logger.warn({
            model: params.model,
            action: params.action,
            durationMs: duration,
            threshold: SLOW_QUERY_THRESHOLD,
          }, `Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
        }

        // Log all queries in debug mode
        if (process.env.DATABASE_QUERY_LOGGING === 'true') {
          logger.debug({
            model: params.model,
            action: params.action,
            durationMs: duration,
          }, `Query: ${params.model}.${params.action}`);
        }

        return result;
      } catch (error) {
        this.stats.errorCount++;
        this.stats.lastError = error instanceof Error ? error.message : String(error);
        this.stats.lastErrorAt = new Date();
        throw error;
      }
    });
  }

  /**
   * Track query time for average calculation
   */
  private trackQueryTime(duration: number): void {
    this.queryTimes.push(duration);

    // Keep only the last N samples
    if (this.queryTimes.length > DatabaseConnection.MAX_QUERY_SAMPLES) {
      this.queryTimes.shift();
    }

    // Calculate running average
    this.stats.avgQueryTime = Math.round(
      this.queryTimes.reduce((sum, t) => sum + t, 0) / this.queryTimes.length
    );
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
    if (this.readClient) {
      await this.readClient.$disconnect();
    }
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

  /**
   * Get connection pool statistics
   */
  getPoolStats(): ConnectionPoolStats {
    return { ...this.stats };
  }

  /**
   * Execute a database operation with exponential backoff retry
   * Useful for transient connection failures
   */
  async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable (connection issues)
        const isRetryable = this.isRetryableError(lastError);

        if (!isRetryable || attempt === MAX_RETRIES - 1) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 100;
        logger.warn({
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          delayMs: delay,
          error: lastError.message,
        }, `Database operation failed, retrying...`);

        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      'connection',
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'socket',
      'timeout',
      'pool',
      'Too many connections',
    ];

    const message = error.message.toLowerCase();
    return retryablePatterns.some(pattern => message.includes(pattern.toLowerCase()));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
