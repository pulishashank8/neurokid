/**
 * Circuit Breaker Service
 *
 * Wraps external service calls with circuit breaker protection to prevent
 * cascade failures when external services are unavailable.
 *
 * Uses the opossum library for circuit breaker implementation.
 */

import CircuitBreaker from 'opossum';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'CircuitBreaker' });

export interface CircuitBreakerOptions {
  /**
   * Time in milliseconds to wait before a request is considered failed
   * Default: 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Percentage of failures required to open the circuit
   * Default: 50
   */
  errorThresholdPercentage?: number;

  /**
   * Time in milliseconds to wait before half-opening the circuit
   * Default: 30000 (30 seconds)
   */
  resetTimeout?: number;

  /**
   * Number of requests to track for statistics
   * Default: 10
   */
  volumeThreshold?: number;
}

export interface CircuitBreakerStats {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  successes: number;
  fallbacks: number;
  timeouts: number;
  cacheHits: number;
  cacheMisses: number;
  percentiles: Record<string, number>;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 10,
};

/**
 * Registry of circuit breakers by name
 */
const circuitBreakers = new Map<string, CircuitBreaker<any>>();

/**
 * Create or get a circuit breaker for a named service
 */
export function getCircuitBreaker<T = any>(
  name: string,
  fn: (...args: any[]) => Promise<T>,
  options: CircuitBreakerOptions = {}
): CircuitBreaker {
  const existing = circuitBreakers.get(name);
  if (existing) {
    return existing;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  const breaker = new CircuitBreaker(fn, {
    timeout: opts.timeout,
    errorThresholdPercentage: opts.errorThresholdPercentage,
    resetTimeout: opts.resetTimeout,
    volumeThreshold: opts.volumeThreshold,
    name,
  });

  // Event handlers for logging and monitoring
  breaker.on('success', () => {
    logger.debug({ circuit: name }, 'Circuit breaker: success');
  });

  breaker.on('timeout', () => {
    logger.warn({ circuit: name }, 'Circuit breaker: timeout');
  });

  breaker.on('reject', () => {
    logger.warn({ circuit: name }, 'Circuit breaker: rejected (circuit open)');
  });

  breaker.on('open', () => {
    logger.error({ circuit: name }, 'Circuit breaker: OPENED (service unavailable)');
  });

  breaker.on('halfOpen', () => {
    logger.info({ circuit: name }, 'Circuit breaker: half-open (testing service)');
  });

  breaker.on('close', () => {
    logger.info({ circuit: name }, 'Circuit breaker: CLOSED (service recovered)');
  });

  breaker.on('fallback', () => {
    logger.info({ circuit: name }, 'Circuit breaker: using fallback');
  });

  circuitBreakers.set(name, breaker as any);
  return breaker as any;
}

/**
 * Get statistics for a circuit breaker
 */
export function getCircuitBreakerStats(name: string): CircuitBreakerStats | null {
  const breaker = circuitBreakers.get(name);
  if (!breaker) return null;

  const stats = breaker.stats;

  return {
    state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
    failures: stats.failures,
    successes: stats.successes,
    fallbacks: stats.fallbacks,
    timeouts: stats.timeouts,
    cacheHits: stats.cacheHits,
    cacheMisses: stats.cacheMisses,
    percentiles: stats.percentiles,
  };
}

/**
 * Get all circuit breaker statistics
 */
export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  const result: Record<string, CircuitBreakerStats> = {};

  for (const name of circuitBreakers.keys()) {
    const stats = getCircuitBreakerStats(name);
    if (stats) {
      result[name] = stats;
    }
  }

  return result;
}

/**
 * Reset a circuit breaker (for testing or manual recovery)
 */
export function resetCircuitBreaker(name: string): boolean {
  const breaker = circuitBreakers.get(name);
  if (!breaker) return false;

  breaker.close();
  return true;
}

/**
 * Pre-configured circuit breakers for common services
 */
export const CircuitBreakers = {
  /**
   * Circuit breaker for Groq AI API
   */
  groq: <T>(fn: () => Promise<T>, fallback?: () => Promise<T>) => {
    const breaker = getCircuitBreaker('groq-api', fn, {
      timeout: 60000, // 60 seconds for AI calls
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      volumeThreshold: 5,
    });

    if (fallback) {
      breaker.fallback(fallback);
    }

    return breaker.fire();
  },

  /**
   * Circuit breaker for Google Gemini API
   */
  gemini: <T>(fn: () => Promise<T>, fallback?: () => Promise<T>) => {
    const breaker = getCircuitBreaker('gemini-api', fn, {
      timeout: 60000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      volumeThreshold: 5,
    });

    if (fallback) {
      breaker.fallback(fallback);
    }

    return breaker.fire();
  },

  /**
   * Circuit breaker for external HTTP calls
   */
  http: <T>(name: string, fn: () => Promise<T>, options?: CircuitBreakerOptions) => {
    const breaker = getCircuitBreaker(`http-${name}`, fn, {
      timeout: 10000,
      errorThresholdPercentage: 50,
      resetTimeout: 15000,
      volumeThreshold: 5,
      ...options,
    });

    return breaker.fire();
  },
};
