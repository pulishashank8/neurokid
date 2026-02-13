/**
 * GET /api/feature-flags
 * Client-side flag fetch - returns enabled/disabled for current user
 * Call from client with optional userId/role for targeting
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAllFlagsForClient } from '@/lib/feature-flags';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const userId = token?.sub ?? undefined;
    const role = (token?.role as string) ?? undefined;

    const flags = await getAllFlagsForClient(userId, role);
    return NextResponse.json({ flags });
  } catch (err) {
    console.error('[feature-flags]', err);
    return NextResponse.json({ flags: {} });
  }
}
