/**
 * CAPTCHA Verification Service
 * 
 * Supports hCaptcha and reCAPTCHA v2/v3
 * Recommended for login, registration, and password reset endpoints
 * 
 * Environment variables:
 *   CAPTCHA_PROVIDER=hcaptcha|recaptcha
 *   CAPTCHA_SECRET_KEY=your_secret_key
 *   NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_site_key
 */

import { NextRequest, NextResponse } from "next/server";

interface CaptchaVerifyResult {
  success: boolean;
  score?: number; // For reCAPTCHA v3 (0.0 - 1.0)
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
}

/**
 * Verify CAPTCHA token with provider
 */
export async function verifyCaptcha(token: string): Promise<CaptchaVerifyResult> {
  const provider = process.env.CAPTCHA_PROVIDER || "hcaptcha";
  const secretKey = process.env.CAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn("CAPTCHA_SECRET_KEY not set - skipping verification");
    return { success: true }; // Allow if not configured (development)
  }

  if (!token) {
    return { 
      success: false, 
      errorCodes: ["missing-input-response"] 
    };
  }

  try {
    let verifyUrl: string;
    let body: URLSearchParams;

    if (provider === "hcaptcha") {
      verifyUrl = "https://hcaptcha.com/siteverify";
      body = new URLSearchParams({
        response: token,
        secret: secretKey,
      });
    } else {
      // reCAPTCHA
      verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
      body = new URLSearchParams({
        response: token,
        secret: secretKey,
      });
    }

    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`CAPTCHA verification failed: ${response.status}`);
    }

    const data = await response.json();

    // For reCAPTCHA v3, check score threshold
    if (provider === "recaptcha" && data.score !== undefined) {
      const minScore = parseFloat(process.env.CAPTCHA_MIN_SCORE || "0.5");
      return {
        success: data.success && data.score >= minScore,
        score: data.score,
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
        errorCodes: data["error-codes"],
      };
    }

    return {
      success: data.success,
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
      errorCodes: data["error-codes"],
    };
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return {
      success: false,
      errorCodes: ["verification-error"],
    };
  }
}

/**
 * Middleware to enforce CAPTCHA on endpoints
 * Expects captchaToken in request body
 */
export async function requireCaptcha(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip in development if not configured
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.CAPTCHA_SECRET_KEY
  ) {
    return null;
  }

  try {
    const body = await request.clone().json();
    const token = body.captchaToken;

    if (!token) {
      return NextResponse.json(
        { error: "CAPTCHA verification required" },
        { status: 400 }
      );
    }

    const result = await verifyCaptcha(token);

    if (!result.success) {
      console.warn("CAPTCHA verification failed:", result.errorCodes);
      return NextResponse.json(
        { error: "CAPTCHA verification failed", codes: result.errorCodes },
        { status: 400 }
      );
    }

    return null;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * Check if CAPTCHA is configured
 */
export function isCaptchaConfigured(): boolean {
  return !!(
    process.env.CAPTCHA_SECRET_KEY && process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY
  );
}

/**
 * Get CAPTCHA configuration for client
 */
export function getCaptchaConfig(): {
  enabled: boolean;
  provider: string;
  siteKey: string | null;
} {
  return {
    enabled: isCaptchaConfigured(),
    provider: process.env.CAPTCHA_PROVIDER || "hcaptcha",
    siteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || null,
  };
}
