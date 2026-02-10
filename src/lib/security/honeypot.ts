/**
 * Honeypot Field Security
 * 
 * Hidden form fields that catch automated bots.
 * Bots typically fill in all visible (and some invisible) fields,
 * while humans won't see or interact with these fields.
 * 
 * Usage:
 *   1. Add <HoneypotField /> to your form (invisible to humans)
 *   2. Check validateHoneypot() on the server
 *   3. If honeypot is filled, silently reject (don't tell bots they were caught)
 */

import { NextRequest, NextResponse } from 'next/server';

// Common honeypot field names - use ones that bots expect but users don't
export const HONEYPOT_FIELD_NAMES = [
  'website',      // Classic honeypot - bots love to fill this
  'url',          // Another common bot target
  'company_name', // Often auto-filled by scrapers
  'fax',          // Obsolete field that bots still try to fill
  'phone_number', // Alternative field name
  'subject',      // Generic field that might confuse bots
] as const;

// Primary field name to use (should be realistic-sounding)
export const DEFAULT_HONEYPOT_FIELD = 'website';

// CSS class that makes fields invisible to humans but not to all bots
export const HONEYPOT_CSS = `
  .hp-field {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

export interface HoneypotValidationResult {
  valid: boolean;
  triggeredFields: string[];
  score: number; // 0 = likely human, 100 = definitely bot
}

/**
 * Validate honeypot fields in request body
 * Returns validation result without throwing (for silent rejection)
 */
export function validateHoneypot(body: Record<string, unknown>): HoneypotValidationResult {
  const triggeredFields: string[] = [];
  let score = 0;

  for (const fieldName of HONEYPOT_FIELD_NAMES) {
    const value = body[fieldName];
    
    // If field exists and has a non-empty value, it's likely a bot
    if (value !== undefined && value !== null && value !== '') {
      triggeredFields.push(fieldName);
      score += 25; // Each triggered field adds to the bot score
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Additional heuristics
  
  // Check for suspiciously fast form submission (if timestamp provided)
  if (body._form_timestamp && typeof body._form_timestamp === 'number') {
    const timeToSubmit = Date.now() - body._form_timestamp;
    // Less than 2 seconds is suspicious for a human
    if (timeToSubmit < 2000) {
      score += 15;
    }
  }

  // Check for common bot patterns in any field
  const allValues = Object.values(body).filter(v => typeof v === 'string').join(' ').toLowerCase();
  const botPatterns = [
    'http://',
    'https://',
    'www.',
    '.com',
    '.net',
    '.org',
    'viagra',
    'casino',
    'loan',
    'credit',
    'weight loss',
    'click here',
    'buy now',
    'limited time',
  ];
  
  for (const pattern of botPatterns) {
    if (allValues.includes(pattern)) {
      score += 5;
    }
  }

  return {
    valid: triggeredFields.length === 0 && score < 30,
    triggeredFields,
    score: Math.min(score, 100),
  };
}

/**
 * Middleware to enforce honeypot validation
 * Silently rejects bots with a fake success response
 */
export function withHoneypot<T extends Record<string, unknown>>(
  handler: (body: T) => Promise<NextResponse>,
  options: { silent?: boolean; logBots?: boolean } = {}
): (body: T) => Promise<NextResponse> {
  const { silent = true, logBots = true } = options;

  return async (body: T) => {
    const result = validateHoneypot(body as Record<string, unknown>);

    if (!result.valid) {
      if (logBots) {
        console.warn('[HONEYPOT] Bot detected:', {
          fields: result.triggeredFields,
          score: result.score,
          timestamp: new Date().toISOString(),
        });
      }

      if (silent) {
        // Return fake success to not alert the bot
        return NextResponse.json({ ok: true, _honeypot: 'caught' });
      }

      return NextResponse.json(
        { error: 'Request rejected' },
        { status: 400 }
      );
    }

    return handler(body);
  };
}

/**
 * Server-side honeypot check for API routes
 * Usage: if (isHoneypotFilled(body)) return fakeSuccessResponse();
 */
export function isHoneypotFilled(body: Record<string, unknown>): boolean {
  const result = validateHoneypot(body);
  return !result.valid;
}

/**
 * Get honeypot field configuration for client-side
 * Returns the field name and CSS class to use
 */
export function getHoneypotConfig(): {
  fieldName: string;
  cssClass: string;
  timestampField: string;
} {
  return {
    fieldName: DEFAULT_HONEYPOT_FIELD,
    cssClass: 'hp-field',
    timestampField: '_form_timestamp',
  };
}

/**
 * Generate timestamp for form (client should include this)
 * Server can check if form was submitted too quickly
 */
export function generateFormTimestamp(): number {
  return Date.now();
}

/**
 * Check if form was submitted suspiciously fast
 * Returns true if suspicious (likely bot)
 */
export function isSuspiciousSubmissionTime(
  timestamp: number,
  minTimeMs: number = 2000
): boolean {
  const elapsed = Date.now() - timestamp;
  return elapsed < minTimeMs;
}
