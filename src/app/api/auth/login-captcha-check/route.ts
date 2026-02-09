/**
 * GET /api/auth/login-captcha-check?email=user@example.com
 * 
 * Checks if CAPTCHA is required for login based on failed attempts
 */

import { NextRequest, NextResponse } from 'next/server';
import { isCaptchaRequired, getRemainingAttempts } from '@/lib/auth/login-captcha';
import { getCaptchaConfig } from '@/lib/captcha';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required' },
      { status: 400 }
    );
  }
  
  // Normalize email for consistent tracking
  const normalizedEmail = email.toLowerCase().trim();
  
  const [captchaRequired, remainingAttempts, captchaConfig] = await Promise.all([
    isCaptchaRequired(normalizedEmail),
    getRemainingAttempts(normalizedEmail),
    getCaptchaConfig(),
  ]);
  
  return NextResponse.json({
    captchaRequired,
    remainingAttempts,
    captchaEnabled: captchaConfig.enabled,
    maxFailedAttempts: 3,
  });
}
