import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { RateLimits, enforceRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { addSecurityHeaders, sanitizeString, validateId } from "@/lib/api-security";

// Validation schema for updates
const DailyWinUpdateSchema = z.object({
  date: z.string().datetime().optional(),
  content: z.string().min(1).max(2000).optional(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format (CUID)
    if (!validateId(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const win = await prisma.dailyWin.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!win) {
      return NextResponse.json({ error: "Win not found" }, { status: 404 });
    }

    const response = NextResponse.json({ win });
    return addSecurityHeaders(response);
  } catch (error) {
    logger.error({ error }, "Error fetching daily win");
    return NextResponse.json(
      { error: "Failed to fetch daily win" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await enforceRateLimit(
      RateLimits.postCreate,
      session.user.id
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ID format
    if (!validateId(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = DailyWinUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify ownership
    const existingWin = await prisma.dailyWin.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingWin) {
      return NextResponse.json({ error: "Win not found" }, { status: 404 });
    }

    // Validate date if provided
    let winDate: Date | undefined;
    if (data.date) {
      winDate = new Date(data.date);
      if (winDate > new Date()) {
        return NextResponse.json(
          { error: "Date cannot be in the future" },
          { status: 400 }
        );
      }
    }

    const win = await prisma.dailyWin.update({
      where: { id },
      data: {
        ...(winDate && { date: winDate }),
        ...(data.content !== undefined && { content: sanitizeString(data.content) || "" }),
        ...(data.mood !== undefined && { mood: data.mood }),
        ...(data.category !== undefined && { category: sanitizeString(data.category) }),
      },
    });

    logger.info({ userId: session.user.id, winId: id }, "Daily win updated");

    const response = NextResponse.json({ win });
    return addSecurityHeaders(response);
  } catch (error) {
    logger.error({ error }, "Error updating daily win");
    return NextResponse.json(
      { error: "Failed to update daily win" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await enforceRateLimit(
      RateLimits.postCreate,
      session.user.id
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ID format
    if (!validateId(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Verify ownership before deletion
    const win = await prisma.dailyWin.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!win) {
      return NextResponse.json({ error: "Win not found" }, { status: 404 });
    }

    await prisma.dailyWin.delete({
      where: { id },
    });

    logger.info({ userId: session.user.id, winId: id }, "Daily win deleted");

    const response = NextResponse.json({ success: true });
    return addSecurityHeaders(response);
  } catch (error) {
    logger.error({ error }, "Error deleting daily win");
    return NextResponse.json(
      { error: "Failed to delete daily win" },
      { status: 500 }
    );
  }
}
