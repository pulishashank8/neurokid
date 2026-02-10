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

// DELETE /api/messages/[messageId] - Delete a message
export const DELETE = withApiHandler(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ messageId: string }> }
  ) => {
    const messageService = container.resolve<IMessageService>(TOKENS.MessageService);
    const { messageId } = await params;

    const searchParams = request.nextUrl.searchParams;
    const deleteType = searchParams.get("type") || "everyone";

    // For now, only support "delete for everyone" (hard delete)
    if (deleteType === "me") {
      throw new ValidationError('Delete for me is not yet supported. Use Delete for Everyone.');
    }

    await messageService.deleteMessage(messageId, request.session.user.id);

    return NextResponse.json({ success: true });
  },
  {
    method: 'DELETE',
    routeName: 'DELETE /api/messages/[messageId]',
    requireAuth: true,
  }
);

// PATCH /api/messages/[messageId] - Update a message
export const PATCH = withApiHandler(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ messageId: string }> }
  ) => {
    const messageService = container.resolve<IMessageService>(TOKENS.MessageService);
    const { messageId } = await params;

    const body = await parseBody<{ content: string }>(request);

    if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
      throw new ValidationError('Content is required');
    }

    const updatedMessage = await messageService.updateMessage(
      messageId,
      request.session.user.id,
      body.content.trim()
    );

    return NextResponse.json(updatedMessage);
  },
  {
    method: 'PATCH',
    routeName: 'PATCH /api/messages/[messageId]',
    requireAuth: true,
  }
);
