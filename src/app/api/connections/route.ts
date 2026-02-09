import { NextResponse } from "next/server";
import { container, TOKENS } from "@/lib/container";
import { withApiHandler, AuthenticatedRequest, parseBody } from "@/lib/api";
import { IConnectionService } from "@/domain/interfaces/services/IConnectionService";
import { ValidationError } from "@/domain/errors";
import { registerDependencies } from "@/lib/container-registrations";
import { z } from "zod";
import { checkProfileComplete } from "@/lib/auth-utils";

// Ensure dependencies are registered
registerDependencies();

const connectionRequestSchema = z.object({
  receiverId: z.string().min(1).optional(),
  receiverUsername: z.string().min(1).optional(),
  message: z.string().max(300, "Message too long").optional(),
}).refine(data => data.receiverId || data.receiverUsername, {
  message: "Either receiverId or receiverUsername is required"
});

// GET /api/connections - List connections or requests
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const connectionService = container.resolve<IConnectionService>(TOKENS.ConnectionService);

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";

    // Check profile complete
    const isProfileComplete = await checkProfileComplete(request.session.user.id);
    if (!isProfileComplete) {
      throw new ValidationError('Please complete your profile first');
    }

    if (type === "pending-received") {
      const requests = await connectionService.listReceivedRequests(request.session.user.id);
      return NextResponse.json({ 
        requests: requests.map(r => ({
          id: r.id,
          message: r.message,
          createdAt: r.createdAt,
          sender: {
            id: r.senderId,
            username: r.senderUsername,
            displayName: r.senderDisplayName,
            avatarUrl: r.senderAvatarUrl,
          },
        }))
      });
    }

    if (type === "pending-sent") {
      const requests = await connectionService.listSentRequests(request.session.user.id);
      return NextResponse.json({ 
        requests: requests.map(r => ({
          id: r.id,
          message: r.message,
          createdAt: r.createdAt,
          receiver: {
            id: r.senderId, // Note: in listSentRequests, sender is current user
            username: r.senderUsername,
            displayName: r.senderDisplayName,
            avatarUrl: r.senderAvatarUrl,
          },
        }))
      });
    }

    if (type === "accepted") {
      const connections = await connectionService.listConnections(request.session.user.id);
      return NextResponse.json({ 
        connections: connections.map(c => ({
          id: c.id,
          connectedAt: c.connectedAt,
          user: {
            id: c.userId,
            username: c.username,
            displayName: c.displayName,
            avatarUrl: c.avatarUrl,
          },
        }))
      });
    }

    throw new ValidationError('Invalid type parameter');
  },
  {
    method: 'GET',
    routeName: 'GET /api/connections',
    requireAuth: true,
    rateLimit: 'connectionRequest',
  }
);

// POST /api/connections - Send connection request
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const connectionService = container.resolve<IConnectionService>(TOKENS.ConnectionService);

    // Check profile complete
    const isProfileComplete = await checkProfileComplete(request.session.user.id);
    if (!isProfileComplete) {
      throw new ValidationError('Please complete your profile first');
    }

    const body = await parseBody<{
      receiverId?: string;
      receiverUsername?: string;
      message?: string;
    }>(request);

    // Validate input
    const validation = connectionRequestSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError('Invalid input', Object.fromEntries(
        validation.error.errors.map(e => [e.path.join('.'), e.message])
      ));
    }

    const { receiverId, receiverUsername, message } = validation.data;

    // For now, we need receiverId. Username lookup would need to be added to service
    if (!receiverId) {
      throw new ValidationError('receiverId is required (receiverUsername not yet supported)');
    }

    await connectionService.sendRequest(request.session.user.id, {
      receiverId,
      message,
    });

    return NextResponse.json({ success: true, message: "Connection request sent" });
  },
  {
    method: 'POST',
    routeName: 'POST /api/connections',
    requireAuth: true,
    rateLimit: 'connectionRequest',
  }
);
