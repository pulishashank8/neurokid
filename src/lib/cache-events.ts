/**
 * Cache Invalidation Events
 * 
 * Event-driven cache updates for distributed cache consistency.
 * Uses Redis Pub/Sub for cross-instance cache invalidation.
 * 
 * How it works:
 * 1. When a service mutates data, it emits a CacheInvalidationEvent
 * 2. The event is published to Redis Pub/Sub channel
 * 3. All application instances subscribe to the channel
 * 4. When an event is received, each instance invalidates its local cache
 * 
 * This ensures cache consistency across multiple server instances
 * without needing a centralized cache or sticky sessions.
 * 
 * Usage:
 *   import { CacheEventBus, CacheInvalidationEvent } from "@/lib/cache-events";
 *   
 *   // Emit cache invalidation after mutation
 *   await CacheEventBus.publish(new CacheInvalidationEvent("user", userId));
 *   
 *   // Listen for specific invalidations
 *   CacheEventBus.subscribe("user", (event) => {
 *     console.log(`User ${event.key} was invalidated`);
 *   });
 */

import { redis, invalidateCache } from "@/lib/redis";

// Event types
export type CacheEventType = "INVALIDATE" | "WARM" | "CLEAR" | "REFRESH";

// Base cache event interface
export interface ICacheEvent {
  id: string;
  type: CacheEventType;
  entityType: string;
  key?: string;
  pattern?: string;
  timestamp: number;
  instanceId: string;
}

// Cache invalidation event
export class CacheInvalidationEvent implements ICacheEvent {
  readonly id: string;
  readonly type: CacheEventType = "INVALIDATE";
  readonly timestamp: number;
  readonly instanceId: string;

  constructor(
    readonly entityType: string,
    readonly key?: string,
    readonly pattern?: string
  ) {
    this.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.instanceId = CacheEventBus.getInstanceId();
  }

  toJSON(): ICacheEvent {
    return {
      id: this.id,
      type: this.type,
      entityType: this.entityType,
      key: this.key,
      pattern: this.pattern,
      timestamp: this.timestamp,
      instanceId: this.instanceId,
    };
  }
}

// Cache warm event
export class CacheWarmEvent implements ICacheEvent {
  readonly id: string;
  readonly type: CacheEventType = "WARM";
  readonly timestamp: number;
  readonly instanceId: string;

  constructor(readonly entityType: string, readonly key?: string) {
    this.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.instanceId = CacheEventBus.getInstanceId();
  }

  toJSON(): ICacheEvent {
    return {
      id: this.id,
      type: this.type,
      entityType: this.entityType,
      key: this.key,
      timestamp: this.timestamp,
      instanceId: this.instanceId,
    };
  }
}

// Cache clear event
export class CacheClearEvent implements ICacheEvent {
  readonly id: string;
  readonly type: CacheEventType = "CLEAR";
  readonly timestamp: number;
  readonly instanceId: string;

  constructor(readonly entityType: string) {
    this.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.instanceId = CacheEventBus.getInstanceId();
  }

  toJSON(): ICacheEvent {
    return {
      id: this.id,
      type: this.type,
      entityType: this.entityType,
      timestamp: this.timestamp,
      instanceId: this.instanceId,
    };
  }
}

// Event handler type
export type CacheEventHandler = (event: ICacheEvent) => void | Promise<void>;

// Subscription management
interface Subscription {
  entityType: string;
  handler: CacheEventHandler;
}

/**
 * Cache Event Bus
 * 
 * Manages Redis Pub/Sub for cross-instance cache invalidation.
 */
class CacheEventBusClass {
  private static instance: CacheEventBusClass;
  private subscribers: Map<string, Set<CacheEventHandler>> = new Map();
  private isSubscribed = false;
  private redisSubscriber: typeof redis | null = null;
  private readonly CHANNEL = "cache:events";
  private readonly instanceId: string;

  constructor() {
    // Generate unique instance ID for this server instance
    this.instanceId = `${process.env.HOSTNAME || "unknown"}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  static getInstance(): CacheEventBusClass {
    if (!CacheEventBusClass.instance) {
      CacheEventBusClass.instance = new CacheEventBusClass();
    }
    return CacheEventBusClass.instance;
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  /**
   * Initialize Redis Pub/Sub subscription
   * Should be called once during application startup
   */
  async initialize(): Promise<void> {
    if (this.isSubscribed || !redis) {
      return;
    }

    try {
      // Create a duplicate connection for subscriber (Pub/Sub requires separate connection)
      this.redisSubscriber = redis.duplicate();

      // Subscribe to cache events channel
      await this.redisSubscriber.subscribe(this.CHANNEL);

      // Handle incoming messages
      this.redisSubscriber.on("message", (channel, message) => {
        if (channel === this.CHANNEL) {
          this.handleMessage(message);
        }
      });

      this.isSubscribed = true;
      console.log(`[CacheEventBus] Subscribed to ${this.CHANNEL} (instance: ${this.instanceId})`);
    } catch (error) {
      console.warn("[CacheEventBus] Failed to initialize Redis Pub/Sub:", error);
      // Non-critical - app works without event bus
    }
  }

  /**
   * Publish a cache event to all instances
   */
  async publish(event: ICacheEvent): Promise<void> {
    // Don't process own events (optional - can be removed if needed)
    if (event.instanceId === this.instanceId) {
      // Still process locally but don't publish back
    }

    // Publish to Redis if available
    if (redis) {
      try {
        await redis.publish(this.CHANNEL, JSON.stringify(event));
      } catch (error) {
        console.warn("[CacheEventBus] Failed to publish event:", error);
      }
    }

    // Process locally as well
    this.processEvent(event);
  }

  /**
   * Subscribe to cache events for a specific entity type
   */
  subscribe(entityType: string, handler: CacheEventHandler): () => void {
    if (!this.subscribers.has(entityType)) {
      this.subscribers.set(entityType, new Set());
    }

    this.subscribers.get(entityType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(entityType)?.delete(handler);
    };
  }

  /**
   * Subscribe to all cache events
   */
  subscribeAll(handler: CacheEventHandler): () => void {
    const unsubscribers: Array<() => void> = [];

    // Subscribe to all known entity types
    for (const entityType of this.subscribers.keys()) {
      unsubscribers.push(this.subscribe(entityType, handler));
    }

    // Return combined unsubscribe function
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  /**
   * Handle incoming Redis message
   */
  private handleMessage(message: string): void {
    try {
      const event: ICacheEvent = JSON.parse(message);

      // Skip events from same instance (already processed locally)
      if (event.instanceId === this.instanceId) {
        return;
      }

      this.processEvent(event);
    } catch (error) {
      console.warn("[CacheEventBus] Failed to parse event:", error);
    }
  }

  /**
   * Process cache event
   */
  private async processEvent(event: ICacheEvent): Promise<void> {
    console.log(`[CacheEventBus] Processing ${event.type} for ${event.entityType}`, {
      key: event.key,
      pattern: event.pattern,
      fromInstance: event.instanceId,
    });

    // Execute default behavior based on event type
    switch (event.type) {
      case "INVALIDATE":
        await this.handleInvalidation(event);
        break;
      case "WARM":
        // Warm events are handled by CacheWarmingService
        break;
      case "CLEAR":
        await this.handleClear(event);
        break;
      case "REFRESH":
        // Refresh is handled by stampede protection
        break;
    }

    // Notify subscribers
    const handlers = this.subscribers.get(event.entityType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.warn("[CacheEventBus] Subscriber handler failed:", error);
        }
      }
    }
  }

  /**
   * Handle invalidation event
   */
  private async handleInvalidation(event: ICacheEvent): Promise<void> {
    const { CacheAsideService } = await import("@/lib/cache-aside");

    if (event.pattern) {
      // Invalidate by pattern
      await CacheAsideService.invalidatePattern(event.entityType, event.pattern);
    } else if (event.key) {
      // Invalidate specific key
      await CacheAsideService.invalidate(event.entityType, event.key);
    } else {
      // Invalidate all for entity type
      await CacheAsideService.clear(event.entityType);
    }
  }

  /**
   * Handle clear event
   */
  private async handleClear(event: ICacheEvent): Promise<void> {
    const { CacheAsideService } = await import("@/lib/cache-aside");
    await CacheAsideService.clear(event.entityType);
  }

  /**
   * Get subscription statistics
   */
  getStats(): {
    isSubscribed: boolean;
    instanceId: string;
    subscriberCount: number;
    entityTypes: string[];
  } {
    return {
      isSubscribed: this.isSubscribed,
      instanceId: this.instanceId,
      subscriberCount: Array.from(this.subscribers.values()).reduce(
        (sum, handlers) => sum + handlers.size,
        0
      ),
      entityTypes: Array.from(this.subscribers.keys()),
    };
  }

  /**
   * Shutdown event bus
   */
  async shutdown(): Promise<void> {
    if (this.redisSubscriber) {
      await this.redisSubscriber.unsubscribe(this.CHANNEL);
      await this.redisSubscriber.quit();
      this.redisSubscriber = null;
      this.isSubscribed = false;
    }
  }
}

// Export singleton instance
export const CacheEventBus = CacheEventBusClass.getInstance();

/**
 * Helper function to invalidate cache across all instances
 * 
 * Usage:
 *   await invalidateAcrossInstances("user", userId);
 *   await invalidateAcrossInstances("posts", undefined, "feed:*");
 */
export async function invalidateAcrossInstances(
  entityType: string,
  key?: string,
  pattern?: string
): Promise<void> {
  const event = new CacheInvalidationEvent(entityType, key, pattern);
  await CacheEventBus.publish(event);
}

/**
 * Helper function to clear cache across all instances
 */
export async function clearAcrossInstances(entityType: string): Promise<void> {
  const event = new CacheClearEvent(entityType);
  await CacheEventBus.publish(event);
}

/**
 * Initialize cache event bus on application startup
 * Call this in instrumentation.ts or app startup
 */
export async function initializeCacheEvents(): Promise<void> {
  await CacheEventBus.initialize();
}
