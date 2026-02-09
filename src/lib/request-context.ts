/**
 * Request-Scoped Container Context
 *
 * Provides request-scoped dependency resolution for services that need
 * access to the current request context (user, request ID, etc.)
 *
 * Usage:
 * 1. In API handler: RequestContext.run(context, async () => { ... })
 * 2. In services: RequestContext.current() to get the current context
 */

import { AsyncLocalStorage } from 'async_hooks';
import { container, DependencyContainer } from 'tsyringe';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'RequestContext' });

export interface RequestContextData {
  requestId: string;
  userId?: string;
  userEmail?: string;
  userRoles?: string[];
  startTime: number;
  ip?: string;
}

class RequestContextManager {
  private storage = new AsyncLocalStorage<{
    data: RequestContextData;
    childContainer: DependencyContainer;
  }>();

  /**
   * Run a function with request-scoped context
   * Creates a child container for request-scoped dependencies
   */
  run<T>(data: RequestContextData, fn: () => T | Promise<T>): T | Promise<T> {
    const childContainer = container.createChildContainer();

    // Register request-scoped values in child container
    childContainer.register('RequestId', { useValue: data.requestId });
    childContainer.register('CurrentUserId', { useValue: data.userId });
    childContainer.register('CurrentUserEmail', { useValue: data.userEmail });
    childContainer.register('CurrentUserRoles', { useValue: data.userRoles || [] });
    childContainer.register('RequestStartTime', { useValue: data.startTime });
    childContainer.register('ClientIp', { useValue: data.ip });

    return this.storage.run({ data, childContainer }, fn);
  }

  /**
   * Get the current request context
   * Returns undefined if not in a request context
   */
  current(): RequestContextData | undefined {
    const store = this.storage.getStore();
    return store?.data;
  }

  /**
   * Get the current request ID
   */
  getRequestId(): string | undefined {
    return this.current()?.requestId;
  }

  /**
   * Get the current user ID
   */
  getCurrentUserId(): string | undefined {
    return this.current()?.userId;
  }

  /**
   * Get the current user roles
   */
  getCurrentUserRoles(): string[] {
    return this.current()?.userRoles || [];
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    return this.getCurrentUserRoles().includes(role);
  }

  /**
   * Check if current user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getCurrentUserId();
  }

  /**
   * Get the request-scoped child container
   * Use this to resolve dependencies with request context
   */
  getContainer(): DependencyContainer {
    const store = this.storage.getStore();
    if (!store) {
      logger.warn('Accessing container outside of request context, using global container');
      return container;
    }
    return store.childContainer;
  }

  /**
   * Resolve a dependency from the request-scoped container
   */
  resolve<T>(token: symbol | string): T {
    return this.getContainer().resolve<T>(token);
  }

  /**
   * Calculate request duration
   */
  getDuration(): number {
    const startTime = this.current()?.startTime;
    if (!startTime) return 0;
    return Date.now() - startTime;
  }
}

// Export singleton instance
export const RequestContext = new RequestContextManager();

/**
 * Decorator for services that need request context
 * Throws if accessed outside of request context
 */
export function requireRequestContext() {
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);

        // Verify we're in a request context
        if (!RequestContext.current()) {
          throw new Error(
            `${constructor.name} requires request context. ` +
            'Ensure this service is used within a RequestContext.run() block.'
          );
        }
      }
    };
  };
}

/**
 * Helper to create a logger with request context
 */
export function createContextualLogger(component: string) {
  const baseLogger = createLogger({ context: component });

  return {
    info: (obj: object, msg: string) => {
      baseLogger.info({ ...obj, requestId: RequestContext.getRequestId() }, msg);
    },
    warn: (obj: object, msg: string) => {
      baseLogger.warn({ ...obj, requestId: RequestContext.getRequestId() }, msg);
    },
    error: (obj: object, msg: string) => {
      baseLogger.error({ ...obj, requestId: RequestContext.getRequestId() }, msg);
    },
    debug: (obj: object, msg: string) => {
      baseLogger.debug({ ...obj, requestId: RequestContext.getRequestId() }, msg);
    },
  };
}
