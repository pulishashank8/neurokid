import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IPostRepository } from '@/domain/interfaces/repositories/IPostRepository';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'ViewCountService' });

/**
 * View Count Service with Redis batching
 * 
 * Uses Redis for real-time counters and periodically flushes to database
 * Reduces database write load significantly
 */
// Deduplication window in seconds (default: 1 hour)
const VIEW_DEDUP_WINDOW_SECONDS = parseInt(process.env.VIEW_DEDUP_WINDOW_SECONDS || '3600', 10);

@injectable()
export class ViewCountService {
  private readonly REDIS_KEY_PREFIX = 'viewcount:post:';
  private readonly REDIS_PROCESSED_SET = 'viewcount:processed';
  private readonly REDIS_VIEWER_PREFIX = 'viewcount:viewers:';
  private redis: any = null;

  constructor(
    @inject(TOKENS.PostRepository) private postRepo: IPostRepository,
    @inject(TOKENS.RedisClient) private redisClient: any
  ) {
    this.redis = redisClient;
  }

  /**
   * Increment view count for a post
   * Uses Redis counter instead of direct DB write
   * Includes deduplication to prevent same user from incrementing multiple times
   *
   * @param postId - The post to increment view count for
   * @param userId - Optional user ID for deduplication
   * @param sessionId - Optional session ID for anonymous deduplication
   */
  async incrementViewCount(postId: string, userId?: string, sessionId?: string): Promise<void> {
    try {
      // Create a viewer identifier (userId takes precedence over sessionId)
      const viewerId = userId || sessionId;

      // Check for deduplication if we have a viewer identifier
      if (viewerId) {
        const viewerKey = `${this.REDIS_VIEWER_PREFIX}${postId}`;

        // Check if this viewer already viewed this post within the window
        const alreadyViewed = await this.redis.sismember(viewerKey, viewerId);

        if (alreadyViewed) {
          logger.debug({ postId, viewerId }, 'Duplicate view ignored');
          return;
        }

        // Add viewer to the set and set expiry
        await this.redis.sadd(viewerKey, viewerId);
        await this.redis.expire(viewerKey, VIEW_DEDUP_WINDOW_SECONDS);
      }

      // Use Redis counter
      const key = `${this.REDIS_KEY_PREFIX}${postId}`;
      await this.redis.incr(key);

      // Add to processed set for batch flushing
      await this.redis.sadd(this.REDIS_PROCESSED_SET, postId);

      // Set expiry on individual key (30 days)
      await this.redis.expire(key, 30 * 24 * 60 * 60);

      logger.debug({ postId, viewerId }, 'View count incremented in Redis');
    } catch (error) {
      // Fallback to direct DB increment on Redis failure
      logger.warn({ error, postId }, 'Redis failed, falling back to DB increment');
      await this.postRepo.incrementViewCount(postId);
    }
  }

  /**
   * Get current view count (Redis + DB)
   */
  async getViewCount(postId: string): Promise<number> {
    try {
      const key = `${this.REDIS_KEY_PREFIX}${postId}`;
      const [redisCount, dbPost] = await Promise.all([
        this.redis.get(key).catch(() => '0'),
        this.postRepo.findById(postId)
      ]);
      
      const redisValue = parseInt(redisCount || '0', 10);
      const dbValue = dbPost?.viewCount || 0;
      
      return dbValue + redisValue;
    } catch (error) {
      logger.error({ error, postId }, 'Error getting view count');
      // Fallback to DB only
      const post = await this.postRepo.findById(postId);
      return post?.viewCount || 0;
    }
  }

  /**
   * Flush accumulated view counts to database
   * Should be called periodically (e.g., every 30 seconds) or before shutdown
   */
  async flushToDatabase(): Promise<{ flushed: number; errors: number }> {
    let flushed = 0;
    let errors = 0;

    try {
      // Get all post IDs that have pending view counts
      const postIds = await this.redis.smembers(this.REDIS_PROCESSED_SET);
      
      if (postIds.length === 0) {
        return { flushed: 0, errors: 0 };
      }

      logger.info({ count: postIds.length }, 'Flushing view counts to database');

      // Process each post
      for (const postId of postIds) {
        try {
          const key = `${this.REDIS_KEY_PREFIX}${postId}`;
          const count = await this.redis.get(key);
          
          if (count && parseInt(count, 10) > 0) {
            // Update database
            await this.postRepo.incrementViewCount(postId);
            
            // Reset Redis counter (keep any increments that came in during flush)
            const currentValue = await this.redis.get(key);
            if (currentValue) {
              const remaining = parseInt(currentValue, 10) - parseInt(count, 10);
              if (remaining > 0) {
                await this.redis.set(key, remaining);
              } else {
                await this.redis.del(key);
                await this.redis.srem(this.REDIS_PROCESSED_SET, postId);
              }
            }
            
            flushed++;
          } else {
            // No pending count, remove from set
            await this.redis.srem(this.REDIS_PROCESSED_SET, postId);
          }
        } catch (error) {
          logger.error({ error, postId }, 'Error flushing view count for post');
          errors++;
        }
      }

      logger.info({ flushed, errors }, 'View count flush complete');
      return { flushed, errors };
    } catch (error) {
      logger.error({ error }, 'Error during view count flush');
      return { flushed, errors };
    }
  }

  /**
   * Get statistics about pending view counts
   */
  async getPendingStats(): Promise<{ pendingPosts: number; totalPendingViews: number }> {
    try {
      const postIds = await this.redis.smembers(this.REDIS_PROCESSED_SET);
      let totalViews = 0;

      for (const postId of postIds) {
        const key = `${this.REDIS_KEY_PREFIX}${postId}`;
        const count = await this.redis.get(key);
        totalViews += parseInt(count || '0', 10);
      }

      return {
        pendingPosts: postIds.length,
        totalPendingViews: totalViews,
      };
    } catch (error) {
      logger.error({ error }, 'Error getting pending view count stats');
      return { pendingPosts: 0, totalPendingViews: 0 };
    }
  }
}
