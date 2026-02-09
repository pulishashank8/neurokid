import { NextResponse } from "next/server";
import { container, TOKENS } from "@/lib/container";
import { withApiHandler, AuthenticatedRequest, parseBody } from "@/lib/api";
import { IConnectionService } from "@/domain/interfaces/services/IConnectionService";
import { ValidationError } from "@/domain/errors";
import { registerDependencies } from "@/lib/container-registrations";
import { z } from "zod";

// Ensure dependencies are registered
registerDependencies();

const actionSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel']),
});

// PATCH /api/connections/[id] - Accept, decline, or cancel connection request
export const PATCH = withApiHandler(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const connectionService = container.resolve<IConnectionService>(TOKENS.ConnectionService);
    const { id } = await params;

    const body = await parseBody<{ action: string }>(request);

    // Validate action
    const validation = actionSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError('Invalid action. Must be accept, decline, or cancel');
    }

    const { action } = validation.data;

    switch (action) {
      case 'accept':
        await connectionService.acceptRequest(id, request.session.user.id);
        return NextResponse.json({ success: true, message: "Connection accepted" });

      case 'decline':
        await connectionService.rejectRequest(id, request.session.user.id);
        return NextResponse.json({ success: true, message: "Connection declined" });

      case 'cancel':
        await connectionService.cancelRequest(id, request.session.user.id);
        return NextResponse.json({ success: true, message: "Request cancelled" });

      default:
        throw new ValidationError('Invalid action');
    }
  },
  {
    method: 'PATCH',
    routeName: 'PATCH /api/connections/[id]',
    requireAuth: true,
  }
);
