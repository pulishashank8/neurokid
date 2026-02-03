import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { RateLimits, enforceRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { addSecurityHeaders, sanitizeString } from "@/lib/api-security";

// Validation schema for daily wins
const DailyWinSchema = z.object({
  date: z.string().datetime().optional(),
  content: z.string().min(1).max(2000),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
});

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryValidation = QuerySchema.safeParse(searchParams);
    
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryValidation.error.format() },
        { status: 400 }
      );
    }

    const { limit, offset } = queryValidation.data;

    const [wins, total] = await Promise.all([
      prisma.dailyWin.findMany({
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.dailyWin.count({
        where: { userId: session.user.id },
      }),
    ]);

    logger.info({ userId: session.user.id, count: wins.length }, "Daily wins fetched");

    const response = NextResponse.json({ 
      wins,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + wins.length,
      },
    });
    
    return addSecurityHeaders(response);
  } catch (error) {
    logger.error({ error }, "Error fetching daily wins");
    return NextResponse.json(
      { error: "Failed to fetch daily wins" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse JSON body safely
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const validation = DailyWinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate date is not in the future
    const winDate = data.date ? new Date(data.date) : new Date();
    if (winDate > new Date()) {
      return NextResponse.json(
        { error: "Date cannot be in the future" },
        { status: 400 }
      );
    }

    const win = await prisma.dailyWin.create({
      data: {
        userId: session.user.id,
        date: winDate,
        content: sanitizeString(data.content) || "",
        mood: data.mood,
        category: sanitizeString(data.category),
      },
    });

    logger.info({ userId: session.user.id, winId: win.id }, "Daily win created");

    const response = NextResponse.json({ win }, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error) {
    logger.error({ error }, "Error creating daily win");
    return NextResponse.json(
      { error: "Failed to create daily win" },
      { status: 500 }
    );
  }
}
