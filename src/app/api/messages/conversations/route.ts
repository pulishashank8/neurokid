import { NextResponse } from "next/server";
import { container, TOKENS } from "@/lib/container";
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
} from "@/lib/api";
import { IMessageService } from "@/domain/interfaces/services/IMessageService";
import { ValidationError } from "@/domain/errors";
import { registerDependencies } from "@/lib/container-registrations";

// Ensure dependencies are registered
registerDependencies();

// GET /api/messages/conversations - List user's conversations
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const messageService = container.resolve<IMessageService>(TOKENS.MessageService);

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const conversations = await messageService.listConversations(
      request.session.user.id,
      limit,
      offset
    );

    return NextResponse.json({ conversations });
  },
  {
    method: 'GET',
    routeName: 'GET /api/messages/conversations',
    requireAuth: true,
  }
);

// POST /api/messages/conversations - Create new conversation
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const messageService = container.resolve<IMessageService>(TOKENS.MessageService);

    const body = await parseBody<{ targetUserId: string }>(request);

    if (!body.targetUserId || typeof body.targetUserId !== 'string') {
      throw new ValidationError('Target user ID is required');
    }

    const result = await messageService.getOrCreateConversation(
      request.session.user.id,
      body.targetUserId
    );

    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  },
  {
    method: 'POST',
    routeName: 'POST /api/messages/conversations',
    requireAuth: true,
  }
);
