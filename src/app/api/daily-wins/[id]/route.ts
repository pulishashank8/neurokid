import { NextResponse } from "next/server";
import { container, TOKENS } from "@/lib/container";
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
} from "@/lib/api";
import { IDailyWinService } from "@/domain/interfaces/services/IDailyWinService";
import { ValidationError, NotFoundError } from "@/domain/errors";
import { registerDependencies } from "@/lib/container-registrations";
import { z } from "zod";

// Ensure dependencies are registered
registerDependencies();

// Validation schema for updates
const DailyWinUpdateSchema = z.object({
  date: z.string().datetime().optional(),
  content: z.string().min(1).max(2000).optional(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
});

// GET /api/daily-wins/[id] - Get single daily win
export const GET = withApiHandler(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const dailyWinService = container.resolve<IDailyWinService>(TOKENS.DailyWinService);
    const { id } = await params;

    const win = await dailyWinService.getById(id, request.session.user.id);

    if (!win) {
      throw new NotFoundError('Daily Win', id);
    }

    return NextResponse.json({ win });
  },
  {
    method: 'GET',
    routeName: 'GET /api/daily-wins/[id]',
    requireAuth: true,
  }
);

// PUT /api/daily-wins/[id] - Update daily win
export const PUT = withApiHandler(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const dailyWinService = container.resolve<IDailyWinService>(TOKENS.DailyWinService);
    const { id } = await params;

    const body = await parseBody<{
      date?: string;
      content?: string;
      mood?: number | null;
      category?: string | null;
    }>(request);

    // Validate input
    const validation = DailyWinUpdateSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', Object.fromEntries(
        validation.error.errors.map(e => [e.path.join('.'), e.message])
      ));
    }

    const data = validation.data;

    // Validate date if provided
    let winDate: Date | undefined;
    if (data.date) {
      winDate = new Date(data.date);
      if (winDate > new Date()) {
        throw new ValidationError('Date cannot be in the future');
      }
    }

    // Verify the win exists
    const existingWin = await dailyWinService.getById(id, request.session.user.id);
    if (!existingWin) {
      throw new NotFoundError('Daily Win', id);
    }

    const win = await dailyWinService.update(
      id,
      request.session.user.id,
      {
        content: data.content,
        mood: data.mood ?? undefined,
        category: data.category ?? undefined,
      }
    );

    return NextResponse.json({ win });
  },
  {
    method: 'PUT',
    routeName: 'PUT /api/daily-wins/[id]',
    requireAuth: true,
  }
);

// DELETE /api/daily-wins/[id] - Delete daily win
export const DELETE = withApiHandler(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const dailyWinService = container.resolve<IDailyWinService>(TOKENS.DailyWinService);
    const { id } = await params;

    // Verify ownership before deletion
    const win = await dailyWinService.getById(id, request.session.user.id);
    if (!win) {
      throw new NotFoundError('Daily Win', id);
    }

    await dailyWinService.delete(id, request.session.user.id);

    return NextResponse.json({ success: true });
  },
  {
    method: 'DELETE',
    routeName: 'DELETE /api/daily-wins/[id]',
    requireAuth: true,
  }
);
