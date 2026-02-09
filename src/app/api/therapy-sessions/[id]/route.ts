import { NextResponse } from "next/server";
import { container, TOKENS } from "@/lib/container";
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
} from "@/lib/api";
import { ITherapySessionService } from "@/domain/interfaces/services/ITherapySessionService";
import { NotFoundError } from "@/domain/errors";
import { registerDependencies } from "@/lib/container-registrations";
import { TherapyType } from "@prisma/client";

// Ensure dependencies are registered
registerDependencies();

// DELETE /api/therapy-sessions/[id] - Delete therapy session
export const DELETE = withApiHandler(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const therapySessionService = container.resolve<ITherapySessionService>(TOKENS.TherapySessionService);
    const { id } = await params;

    // Verify the session exists and belongs to user
    const existingSession = await therapySessionService.getById(id, request.session.user.id);
    if (!existingSession) {
      throw new NotFoundError('Therapy Session', id);
    }

    await therapySessionService.delete(id, request.session.user.id);

    return NextResponse.json({ success: true });
  },
  {
    method: 'DELETE',
    routeName: 'DELETE /api/therapy-sessions/[id]',
    requireAuth: true,
  }
);

// PUT /api/therapy-sessions/[id] - Update therapy session
export const PUT = withApiHandler(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const therapySessionService = container.resolve<ITherapySessionService>(TOKENS.TherapySessionService);
    const { id } = await params;

    const body = await parseBody<{
      childName?: string;
      therapistName?: string;
      therapyType?: string;
      sessionDate?: string;
      duration?: number;
      notes?: string;
      wentWell?: string;
      toWorkOn?: string;
      mood?: number;
    }>(request);

    // Verify the session exists and belongs to user
    const existingSession = await therapySessionService.getById(id, request.session.user.id);
    if (!existingSession) {
      throw new NotFoundError('Therapy Session', id);
    }

    const updatedSession = await therapySessionService.update(
      id,
      request.session.user.id,
      {
        childName: body.childName,
        therapistName: body.therapistName,
        therapyType: body.therapyType as TherapyType,
        sessionDate: body.sessionDate ? new Date(body.sessionDate) : undefined,
        duration: body.duration,
        notes: body.notes,
        wentWell: body.wentWell,
        toWorkOn: body.toWorkOn,
        mood: body.mood,
      }
    );

    return NextResponse.json({ session: updatedSession });
  },
  {
    method: 'PUT',
    routeName: 'PUT /api/therapy-sessions/[id]',
    requireAuth: true,
  }
);
