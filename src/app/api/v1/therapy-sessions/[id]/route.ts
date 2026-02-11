/**
 * Individual Therapy Session API v1
 * 
 * GET, PUT, DELETE for specific therapy session
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { TherapySessionService } from "@/services/therapy-session.service";
import { withApiHandler } from "@/lib/api/api-handler";
import { NotFoundError } from "@/domain/errors";
import { z } from "zod";

const updateSchema = z.object({
  childName: z.string().min(1).max(100).optional(),
  therapistName: z.string().min(1).max(100).optional(),
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
  sessionDate: z.string().datetime().optional(),
  duration: z.number().min(1).max(480).optional(),
  notes: z.string().max(10000).optional().nullable(),
  wentWell: z.string().max(5000).optional().nullable(),
  toWorkOn: z.string().max(5000).optional().nullable(),
  mood: z.number().min(1).max(5).optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/therapy-sessions/[id]
 */
export const GET = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const session_data = await TherapySessionService.getSession(
      id,
      session.user.id
    );

    return NextResponse.json({ session: session_data });
  },
  {
    routeName: "GET /api/v1/therapy-sessions/[id]",
    rateLimit: "therapySessionRead",
  }
);

/**
 * PUT /api/v1/therapy-sessions/[id]
 */
export const PUT = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Build update data with proper type conversion
    const updateData: any = { ...validation.data };
    if (validation.data.sessionDate) {
      updateData.sessionDate = new Date(validation.data.sessionDate);
    }

    const updated = await TherapySessionService.update(
      id,
      session.user.id,
      updateData
    );

    return NextResponse.json({ session: updated });
  },
  {
    routeName: "PUT /api/v1/therapy-sessions/[id]",
    rateLimit: "therapySessionCreate",
  }
);

/**
 * DELETE /api/v1/therapy-sessions/[id]
 */
export const DELETE = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await TherapySessionService.delete(id, session.user.id);

    return NextResponse.json({ success: true });
  },
  {
    routeName: "DELETE /api/v1/therapy-sessions/[id]",
    rateLimit: "therapySessionCreate",
  }
);
