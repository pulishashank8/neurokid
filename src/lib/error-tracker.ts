/**
 * Client-side error tracker for Pillar 10 — User Problem Detection
 * Batches errors and sends to /api/owner/events/errors every 30s
 * Target: <3KB gzipped
 */

export type ErrorType =
  | 'JS_ERROR'
  | 'NETWORK_FAILURE'
  | 'RAGE_CLICK'
  | 'SLOW_PAGE'
  | 'DEAD_CLICK'
  | 'MEDIA_ERROR'
  | 'FORM_SUBMIT'
  | 'FEATURE_CRASH';

interface QueuedError {
  errorType: ErrorType;
  message: string;
  stackTrace?: string;
  pagePath: string;
  pageTitle?: string;
  elementId?: string;
  metadata?: Record<string, unknown>;
}

const BATCH_INTERVAL_MS = 30000;
const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 2000;
const SLOW_PAGE_THRESHOLD_MS = 3000;

let queue: QueuedError[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let rageClickMap = new Map<string, { count: number; firstAt: number }>();

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/mobile|android|iphone|ipad/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function getPageInfo(): { pagePath: string; pageTitle: string } {
  if (typeof window === 'undefined') return { pagePath: '/', pageTitle: '' };
  return {
    pagePath: window.location.pathname || '/',
    pageTitle: document.title || '',
  };
}

function enqueue(err: QueuedError) {
  const pageInfo = getPageInfo();
  queue.push({
    ...err,
    ...pageInfo,
    metadata: {
      ...err.metadata,
      deviceType: getDeviceType(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    },
  });
  scheduleBatch();
}

function scheduleBatch() {
  if (batchTimer) return;
  batchTimer = setTimeout(flush, BATCH_INTERVAL_MS);
}

export function flush() {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  if (queue.length === 0) return;
  const batch = [...queue];
  queue = [];
  fetch('/api/owner/events/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ errors: batch }),
    keepalive: true,
  }).catch(() => {});
}

function initGlobalHandlers() {
  if (typeof window === 'undefined') return;

  window.onerror = (msg, src, line, col, err) => {
    enqueue({
      errorType: 'JS_ERROR',
      message: String(msg),
      stackTrace: err?.stack,
      ...getPageInfo(),
      metadata: { src, line, col },
    });
  };

  window.addEventListener('unhandledrejection', (e) => {
    enqueue({
      errorType: 'JS_ERROR',
      message: String(e.reason?.message ?? e.reason),
      stackTrace: e.reason?.stack,
      ...getPageInfo(),
    });
  });

  // Slow page load
  if (document.readyState === 'complete') {
    const loadTime = performance.now();
    if (loadTime > SLOW_PAGE_THRESHOLD_MS) {
      enqueue({
        errorType: 'SLOW_PAGE',
        message: `Page load took ${Math.round(loadTime)}ms`,
        ...getPageInfo(),
        metadata: { loadTimeMs: loadTime },
      });
    }
  } else {
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      if (loadTime > SLOW_PAGE_THRESHOLD_MS) {
        enqueue({
          errorType: 'SLOW_PAGE',
          message: `Page load took ${Math.round(loadTime)}ms`,
          ...getPageInfo(),
          metadata: { loadTimeMs: loadTime },
        });
      }
    });
  }

  // Rage clicks: 3+ clicks on same element in 2s
  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const id = el.id || el.className || el.tagName || 'unknown';
    const key = `${getPageInfo().pagePath}::${id}`;
    const now = Date.now();
    const entry = rageClickMap.get(key);
    if (entry) {
      if (now - entry.firstAt > RAGE_CLICK_WINDOW_MS) {
        rageClickMap.set(key, { count: 1, firstAt: now });
      } else {
        entry.count++;
        if (entry.count >= RAGE_CLICK_THRESHOLD) {
          enqueue({
            errorType: 'RAGE_CLICK',
            message: `${entry.count} rapid clicks on ${id}`,
            elementId: id,
            ...getPageInfo(),
            metadata: { count: entry.count },
          });
          rageClickMap.delete(key);
        }
      }
    } else {
      rageClickMap.set(key, { count: 1, firstAt: now });
    }
  });

  // Network failures via fetch (5xx and connection errors only)
  const origFetch = window.fetch;
  window.fetch = function (...args) {
    return origFetch.apply(this, args).then((res) => {
      if (res.status >= 500) {
        enqueue({
          errorType: 'NETWORK_FAILURE',
          message: `Server error: ${res.status} ${String(args[0]).slice(0, 100)}`,
          ...getPageInfo(),
          metadata: { url: String(args[0]), status: res.status },
        });
      }
      return res;
    }).catch((err) => {
      enqueue({
        errorType: 'NETWORK_FAILURE',
        message: err?.message || 'Network request failed',
        ...getPageInfo(),
        metadata: { url: String(args[0]).slice(0, 200) },
      });
      throw err;
    });
  };
}

export function reportError(
  type: ErrorType,
  message: string,
  options?: { stackTrace?: string; elementId?: string; metadata?: Record<string, unknown> }
) {
  enqueue({
    errorType: type,
    message,
    stackTrace: options?.stackTrace,
    elementId: options?.elementId,
    ...getPageInfo(),
    metadata: options?.metadata,
  });
}

let initialized = false;
export function initErrorTracker() {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;
  initGlobalHandlers();
}
