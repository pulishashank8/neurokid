/**
 * Therapy Sessions API v1
 * 
 * Production-grade endpoint with:
 * - Field-level encryption for PHI
 * - Audit logging for HIPAA compliance
 * - Rate limiting
 * - Proper error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { TherapySessionService } from "@/services/therapy-session.service";
import { withApiHandler, getClientIp } from "@/lib/api-handler";
import { enforceRateLimit, RateLimits } from "@/lib/rate-limit";
import { z } from "zod";

// Validation schemas
const createSchema = z.object({
  childName: z.string().min(1).max(100),
  therapistName: z.string().min(1).max(100),
  therapyType: z.enum([
    "ABA",
    "OCCUPATIONAL",
    "SPEECH",
    "BEHAVIORAL",
    "PLAY",
    "SOCIAL_SKILLS",
    "PHYSICAL",
    "OTHER",
  ]),
  sessionDate: z.string().datetime(),
  duration: z.number().min(1).max(480).optional(),
  notes: z.string().max(10000).optional(),
  wentWell: z.string().max(5000).optional(),
  toWorkOn: z.string().max(5000).optional(),
  mood: z.number().min(1).max(5).optional(),
});

const querySchema = z.object({
  childName: z.string().optional(),
  therapyType: z.enum([
    "ABA",
    "OCCUPATIONAL",
    "SPEECH",
    "BEHAVIORAL",
    "PLAY",
    "SOCIAL_SKILLS",
    "PHYSICAL",
    "OTHER",
  ]).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/v1/therapy-sessions
 * List therapy sessions for authenticated user
 */
export const GET = withApiHandler(
  async (request: NextRequest) => {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      childName: searchParams.get("childName") || undefined,
      therapyType: searchParams.get("therapyType") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const { sessions, total } = await TherapySessionService.getUserSessions(
      session.user.id,
      queryResult.data
    );

    return NextResponse.json({
      sessions,
      pagination: {
        total,
        limit: queryResult.data.limit,
        offset: queryResult.data.offset,
        hasMore: total > queryResult.data.offset + sessions.length,
      },
    });
  },
  {
    routeName: "GET /api/v1/therapy-sessions",
    rateLimit: "therapySessionRead",
  }
);

/**
 * POST /api/v1/therapy-sessions
 * Create new therapy session
 */
export const POST = withApiHandler(
  async (request: NextRequest) => {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const session_data = await TherapySessionService.create({
      userId: session.user.id,
      ...validation.data,
      sessionDate: new Date(validation.data.sessionDate),
    });

    return NextResponse.json({ session: session_data }, { status: 201 });
  },
  {
    routeName: "POST /api/v1/therapy-sessions",
    rateLimit: "therapySessionCreate",
  }
);
