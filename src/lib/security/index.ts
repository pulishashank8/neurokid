/**
 * Security Library Exports
 * 
 * Centralized exports for all security-related utilities
 */

// Honeypot protection
export {
  HoneypotField,
  AriaHoneypotField,
} from '@/components/security/HoneypotField';

export {
  validateHoneypot,
  withHoneypot,
  isHoneypotFilled,
  getHoneypotConfig,
  generateFormTimestamp,
  isSuspiciousSubmissionTime,
  HONEYPOT_FIELD_NAMES,
  DEFAULT_HONEYPOT_FIELD,
  HONEYPOT_CSS,
  type HoneypotValidationResult,
} from './honeypot';

// User agent validation
export {
  checkUserAgent,
  userAgentMiddleware,
  isSearchEngineCrawler,
  getCrawlerInfo,
  validateUserAgent,
  type UserAgentCheckResult,
} from './user-agent';

// Request fingerprinting
export {
  createFingerprint,
  createBrowserFingerprint,
  trackVelocity,
  checkVelocity,
  detectAnomalies,
  analyzeRequest,
  generateClientFingerprint,
  VELOCITY_THRESHOLD,
  SUSPICIOUS_VELOCITY,
  VELOCITY_WINDOW_MS,
  type ClientFingerprint,
} from './request-fingerprint';
