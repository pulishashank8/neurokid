import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler, parseBody } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limit';

/**
 * Content Security Policy (CSP) Reporting Endpoint
 * 
 * Receives CSP violation reports from browsers when content security policies are violated.
 * This helps detect and fix XSS vulnerabilities and other security issues.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri
 */

const logger = createLogger({ context: 'csp-report' });

// Rate limiting: Max 100 reports per IP per hour
const reportCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_REPORTS_PER_HOUR = 100;
const HOUR_IN_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = reportCounts.get(ip);

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    reportCounts.set(ip, {
      count: 1,
      resetTime: now + HOUR_IN_MS,
    });
    return false;
  }

  if (entry.count >= MAX_REPORTS_PER_HOUR) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of reportCounts.entries()) {
    if (now > entry.resetTime) {
      reportCounts.delete(ip);
    }
  }
}, HOUR_IN_MS);

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const ip = getClientIp(request);

    // Rate limit check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    try {
      const body = await parseBody<{
        'csp-report'?: {
          'document-uri'?: string;
          'referrer'?: string;
          'blocked-uri'?: string;
          'violated-directive'?: string;
          'original-policy'?: string;
          'source-file'?: string;
          'line-number'?: number;
          'column-number'?: number;
          'script-sample'?: string;
        };
      }>(request);

      const report = body['csp-report'];

      if (!report) {
        return NextResponse.json(
          { error: 'Invalid CSP report format' },
          { status: 400 }
        );
      }

      // Log the CSP violation
      logger.warn({
        type: 'csp_violation',
        ip,
        documentUri: report['document-uri'],
        blockedUri: report['blocked-uri'],
        violatedDirective: report['violated-directive'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        columnNumber: report['column-number'],
        scriptSample: report['script-sample']?.substring(0, 100), // Truncate for safety
      }, 'CSP violation reported');

      // In production, you might want to:
      // 1. Send to a security monitoring service (e.g., Sentry)
      // 2. Store in database for analysis
      // 3. Alert security team for critical violations

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error({ error, ip }, 'Failed to process CSP report');
      return NextResponse.json(
        { error: 'Failed to process report' },
        { status: 500 }
      );
    }
  },
  {
    method: 'POST',
    routeName: 'POST /api/csp-report',
    requireAuth: false,
  }
);

/**
 * GET endpoint to verify CSP reporting is configured
 */
export const GET = withApiHandler(
  async () => {
    return NextResponse.json({
      status: 'CSP reporting endpoint active',
      documentation: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri',
    });
  },
  {
    method: 'GET',
    routeName: 'GET /api/csp-report',
    requireAuth: false,
  }
);
