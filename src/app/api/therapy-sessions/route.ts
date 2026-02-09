import { NextResponse } from "next/server";
import { container, TOKENS } from "@/lib/container";
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
} from "@/lib/api";
import { ITherapySessionService } from "@/domain/interfaces/services/ITherapySessionService";
import { ValidationError } from "@/domain/errors";
import { registerDependencies } from "@/lib/container-registrations";
import { TherapyType } from "@prisma/client";

// Ensure dependencies are registered
registerDependencies();

// GET /api/therapy-sessions - List user's therapy sessions
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const therapySessionService = container.resolve<ITherapySessionService>(TOKENS.TherapySessionService);

    const searchParams = request.nextUrl.searchParams;
    const childName = searchParams.get("childName") || undefined;
    const therapyTypeParam = searchParams.get("therapyType");
    const therapyType = therapyTypeParam ? therapyTypeParam as TherapyType : undefined;

    const result = await therapySessionService.list(
      request.session.user.id,
      {
        childName,
        therapyType,
        limit: 50,
        offset: 0,
      }
    );

    return NextResponse.json({ sessions: result.data });
  },
  {
    method: 'GET',
    routeName: 'GET /api/therapy-sessions',
    requireAuth: true,
  }
);

// POST /api/therapy-sessions - Create new therapy session
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const therapySessionService = container.resolve<ITherapySessionService>(TOKENS.TherapySessionService);

    const body = await parseBody<{
      childName: string;
      therapistName: string;
      therapyType: string;
      sessionDate: string;
      duration?: number;
      notes?: string;
      wentWell?: string;
      toWorkOn?: string;
      mood?: number;
    }>(request);

    // Validate required fields
    if (!body.childName || !body.therapistName || !body.therapyType || !body.sessionDate) {
      throw new ValidationError('Missing required fields', {
        childName: !body.childName ? 'Required' : '',
        therapistName: !body.therapistName ? 'Required' : '',
        therapyType: !body.therapyType ? 'Required' : '',
        sessionDate: !body.sessionDate ? 'Required' : '',
      });
    }

    const session = await therapySessionService.create(
      request.session.user.id,
      {
        childName: body.childName!,
        therapistName: body.therapistName!,
        therapyType: body.therapyType! as TherapyType,
        sessionDate: new Date(body.sessionDate!),
        duration: body.duration || 60,
        notes: body.notes || undefined,
        wentWell: body.wentWell || undefined,
        toWorkOn: body.toWorkOn || undefined,
        mood: body.mood || undefined,
      }
    );

    return NextResponse.json({ session }, { status: 201 });
  },
  {
    method: 'POST',
    routeName: 'POST /api/therapy-sessions',
    requireAuth: true,
  }
);
