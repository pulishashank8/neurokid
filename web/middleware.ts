import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Simplified security headers middleware
 * Auth and logging temporarily disabled to fix loading issues
 */

export async function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Basic security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

// Apply middleware to all routes except static files, images, etc.
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (data files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico|public).*)",
  ],
};
