import { NextResponse } from "next/server";
import { getCaptchaConfig } from "@/lib/captcha";

/**
 * GET /api/auth/captcha-config
 * Returns CAPTCHA configuration for the client
 */
export async function GET(): Promise<NextResponse> {
  const config = getCaptchaConfig();
  
  // Only expose necessary fields to the client
  return NextResponse.json({
    enabled: config.enabled,
    provider: config.provider,
    siteKey: config.siteKey,
  });
}
