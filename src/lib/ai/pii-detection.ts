/**
 * PII Detection and Redaction
 * 
 * Detects and redacts personally identifiable information (PII) from
 * text content to protect user privacy in AI interactions and logs.
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'PIIDetection' });

// PII patterns
const PII_PATTERNS = {
  // US Social Security Number
  ssn: {
    pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
    name: 'SSN',
  },
  // Email address
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    name: 'EMAIL',
  },
  // Phone number (US format)
  phone: {
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    name: 'PHONE',
  },
  // Credit card number
  creditCard: {
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    name: 'CREDIT_CARD',
  },
  // Date of birth (common formats)
  dob: {
    pattern: /\b(?:0[1-9]|1[0-2])[\/\-.](?:0[1-9]|[12]\d|3[01])[\/\-.](?:19|20)\d{2}\b/g,
    name: 'DOB',
  },
  // IP address
  ipAddress: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    name: 'IP_ADDRESS',
  },
  // Street address (simplified)
  streetAddress: {
    pattern: /\b\d+\s+\w+\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)\b/gi,
    name: 'ADDRESS',
  },
};

export interface PIIFinding {
  type: string;
  start: number;
  end: number;
  value: string;
}

export interface PIIResult {
  hasPII: boolean;
  findings: PIIFinding[];
  redacted: string;
  redactionCount: number;
}

/**
 * Detect PII in text
 */
export function detectPII(text: string): PIIResult {
  const findings: PIIFinding[] = [];

  for (const [key, { pattern, name }] of Object.entries(PII_PATTERNS)) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      findings.push({
        type: name,
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
      });
    }
  }

  // Sort by position
  findings.sort((a, b) => a.start - b.start);

  // Remove overlapping findings (keep first)
  const uniqueFindings: PIIFinding[] = [];
  let lastEnd = -1;

  for (const finding of findings) {
    if (finding.start >= lastEnd) {
      uniqueFindings.push(finding);
      lastEnd = finding.end;
    }
  }

  return {
    hasPII: uniqueFindings.length > 0,
    findings: uniqueFindings,
    redacted: redactPII(text, uniqueFindings),
    redactionCount: uniqueFindings.length,
  };
}

/**
 * Redact PII from text
 */
function redactPII(text: string, findings: PIIFinding[]): string {
  let redacted = text;
  let offset = 0;

  for (const finding of findings) {
    const start = finding.start + offset;
    const end = finding.end + offset;
    const replacement = `[${finding.type}]`;

    redacted = redacted.substring(0, start) + replacement + redacted.substring(end);
    offset += replacement.length - (end - start);
  }

  return redacted;
}

/**
 * Redact PII from messages for logging/auditing
 */
export function redactMessagesPII(
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; content: string; redacted?: boolean }> {
  return messages.map((msg) => {
    const piiResult = detectPII(msg.content);
    if (piiResult.hasPII) {
      return {
        role: msg.role,
        content: piiResult.redacted,
        redacted: true,
      };
    }
    return msg;
  });
}

/**
 * Sanitize text for safe logging
 */
export function sanitizeForLogging(text: string): string {
  const piiResult = detectPII(text);
  return piiResult.redacted;
}

/**
 * Check if text contains sensitive PII that should block processing
 */
export function containsSensitivePII(text: string): boolean {
  const piiResult = detectPII(text);

  // Block if contains SSN or credit card
  const sensitiveTypes = ['SSN', 'CREDIT_CARD'];
  return piiResult.findings.some((f) => sensitiveTypes.includes(f.type));
}

/**
 * Hash PII for correlation without storing actual values
 */
export function hashPII(value: string): string {
  // Simple hash for correlation purposes
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `hash:${Math.abs(hash).toString(16)}`;
}

/**
 * Extract and hash PII for audit trails
 */
export function extractPIIHashes(text: string): string[] {
  const piiResult = detectPII(text);
  return piiResult.findings.map((f) => hashPII(f.value));
}

/**
 * Validate and clean user input
 */
export function cleanUserInput(
  input: string,
  options?: {
    maxLength?: number;
    redactPII?: boolean;
    removeUrls?: boolean;
  }
): { cleaned: string; wasModified: boolean; issues: string[] } {
  const issues: string[] = [];
  let cleaned = input;
  let wasModified = false;

  // Check length
  const maxLength = options?.maxLength || 4000;
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
    issues.push(`Truncated to ${maxLength} characters`);
    wasModified = true;
  }

  // Redact PII
  if (options?.redactPII !== false) {
    const piiResult = detectPII(cleaned);
    if (piiResult.hasPII) {
      cleaned = piiResult.redacted;
      issues.push(`Redacted ${piiResult.redactionCount} PII elements`);
      wasModified = true;
    }
  }

  // Remove URLs if requested
  if (options?.removeUrls) {
    const urlPattern = /https?:\/\/[^\s]+/g;
    if (urlPattern.test(cleaned)) {
      cleaned = cleaned.replace(urlPattern, '[URL_REMOVED]');
      issues.push('URLs removed');
      wasModified = true;
    }
  }

  return { cleaned, wasModified, issues };
}
