import { NextResponse } from "next/server";
import { container, TOKENS } from "@/lib/container";
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
} from "@/lib/api";
import { IDailyWinService } from "@/domain/interfaces/services/IDailyWinService";
import { ValidationError } from "@/domain/errors";
import { registerDependencies } from "@/lib/container-registrations";
import { z } from "zod";

// Ensure dependencies are registered
registerDependencies();

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

// GET /api/daily-wins - List user's daily wins
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const dailyWinService = container.resolve<IDailyWinService>(TOKENS.DailyWinService);

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryValidation = QuerySchema.safeParse(searchParams);
    
    if (!queryValidation.success) {
      throw new ValidationError('Invalid query parameters', Object.fromEntries(
        queryValidation.error.errors.map(e => [e.path.join('.'), e.message])
      ));
    }

    const { limit, offset } = queryValidation.data;

    const result = await dailyWinService.list(
      request.session.user.id,
      { limit, offset }
    );

    return NextResponse.json({ 
      wins: result.data,
      pagination: result.pagination,
    });
  },
  {
    method: 'GET',
    routeName: 'GET /api/daily-wins',
    requireAuth: true,
    rateLimit: 'readPost',
  }
);

// POST /api/daily-wins - Create new daily win
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const dailyWinService = container.resolve<IDailyWinService>(TOKENS.DailyWinService);

    const body = await parseBody<{
      date?: string;
      content: string;
      mood?: number | null;
      category?: string | null;
    }>(request);

    // Validate input
    const validation = DailyWinSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', Object.fromEntries(
        validation.error.errors.map(e => [e.path.join('.'), e.message])
      ));
    }

    const data = validation.data;

    // Validate date is not in the future
    const winDate = data.date ? new Date(data.date) : new Date();
    if (winDate > new Date()) {
      throw new ValidationError('Date cannot be in the future');
    }

    const win = await dailyWinService.create(
      request.session.user.id,
      {
        date: winDate,
        content: data.content,
        mood: data.mood ?? undefined,
        category: data.category ?? undefined,
      }
    );

    return NextResponse.json({ win }, { status: 201 });
  },
  {
    method: 'POST',
    routeName: 'POST /api/daily-wins',
    requireAuth: true,
    rateLimit: 'postCreate',
  }
);
