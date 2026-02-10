import { container, TOKENS } from '@/lib/container';
import { ViewCountService } from '@/application/services/ViewCountService';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'ViewCountProcessor' });

/**
 * View Count Processor
 *
 * Periodically flushes view counts from Redis to the database.
 * This reduces database write load by batching view count updates.
 *
 * Default flush interval: 30 seconds (configurable via VIEW_COUNT_FLUSH_INTERVAL_MS)
 */
export class ViewCountProcessor {
  private flushInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly intervalMs: number;

  constructor(
    private viewCountService: ViewCountService,
    intervalMs?: number
  ) {
    this.intervalMs = intervalMs ?? parseInt(
      process.env.VIEW_COUNT_FLUSH_INTERVAL_MS || '30000',
      10
    );
  }

  /**
   * Start the periodic flush process
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('ViewCountProcessor is already running');
      return;
    }

    this.isRunning = true;
    logger.info({ intervalMs: this.intervalMs }, 'Starting ViewCountProcessor');

    // Run immediately on start
    this.flush();

    // Then run periodically
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.intervalMs);
  }

  /**
   * Stop the processor and perform final flush
   */
  async close(): Promise<void> {
    if (!this.isRunning) return;

    logger.info('Stopping ViewCountProcessor...');

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Perform final flush before closing
    await this.flush();

    this.isRunning = false;
    logger.info('ViewCountProcessor stopped');
  }

  /**
   * Flush view counts from Redis to database
   */
  private async flush(): Promise<void> {
    try {
      const result = await this.viewCountService.flushToDatabase();

      if (result.flushed > 0 || result.errors > 0) {
        logger.info({
          flushed: result.flushed,
          errors: result.errors,
        }, 'View count flush completed');
      }
    } catch (error) {
      logger.error({ error }, 'Error flushing view counts');
    }
  }

  /**
   * Get current statistics
   */
  async getStats(): Promise<{
    isRunning: boolean;
    intervalMs: number;
    pendingPosts: number;
    totalPendingViews: number;
  }> {
    const pending = await this.viewCountService.getPendingStats();

    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      ...pending,
    };
  }
}

/**
 * Factory function to create ViewCountProcessor from DI container
 */
export function createViewCountProcessor(): ViewCountProcessor {
  const viewCountService = container.resolve<ViewCountService>(TOKENS.ViewCountService);
  return new ViewCountProcessor(viewCountService);
}
