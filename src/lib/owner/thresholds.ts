/**
 * Configurable thresholds for owner dashboard alerts and health status.
 * Override via environment variables for deployment-specific tuning.
 */

function envNum(key: string, defaultVal: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultVal;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? defaultVal : n;
}

/** DB latency (ms) above which to show WARNING. Default 1500 for remote DBs (e.g. Supabase). */
export const DB_LATENCY_WARN_MS = envNum('OWNER_DB_WARN_MS', 1500);

/** DB latency (ms) above which to show CRITICAL. Default 3000. */
export const DB_LATENCY_CRITICAL_MS = envNum('OWNER_DB_CRITICAL_MS', 3000);

/** Rate limit triggers in 5m above which to show WARNING. Default 50. */
export const RATE_LIMIT_WARN = envNum('OWNER_RATE_LIMIT_WARN', 50);

/** AI failures in 5m above which to show WARNING. Default 10. */
export const AI_FAILURES_WARN = envNum('OWNER_AI_FAILURES_WARN', 10);
