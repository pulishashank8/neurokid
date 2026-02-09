import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IConnectionService, ConnectionDTO, ConnectionRequestDTO, SendConnectionRequestInput } from '@/domain/interfaces/services/IConnectionService';
import { IConnectionRepository } from '@/domain/interfaces/repositories/IConnectionRepository';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '@/domain/errors';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'ConnectionService' });

@injectable()
export class ConnectionService implements IConnectionService {
  constructor(
    @inject(TOKENS.ConnectionRepository) private connectionRepo: IConnectionRepository,
    @inject(TOKENS.UserRepository) private userRepo: IUserRepository
  ) {}

  async listConnections(userId: string): Promise<ConnectionDTO[]> {
    const connections = await this.connectionRepo.listByUser(userId);
    
    // Get details for each connection
    const connectionDTOs: ConnectionDTO[] = [];
    for (const conn of connections) {
      const otherUserId = conn.userA === userId ? conn.userB : conn.userA;
      const user = await this.userRepo.findByIdWithProfile(otherUserId);
      
      if (user) {
        connectionDTOs.push({
          id: conn.id,
          userId: otherUserId,
          username: user.profile?.username || 'Unknown',
          displayName: user.profile?.displayName || 'Unknown',
          avatarUrl: user.profile?.avatarUrl || null,
          connectedAt: conn.createdAt,
        });
      }
    }

    return connectionDTOs;
  }

  async removeConnection(userId: string, connectionId: string): Promise<void> {
    const connection = await this.connectionRepo.findById(connectionId);
    if (!connection) {
      throw new NotFoundError('Connection', connectionId);
    }

    // Verify user is part of this connection
    if (connection.userA !== userId && connection.userB !== userId) {
      throw new ForbiddenError('Cannot remove this connection');
    }

    await this.connectionRepo.delete(connectionId);
    logger.info({ userId, connectionId }, 'Connection removed');
  }

  async areConnected(userIdA: string, userIdB: string): Promise<boolean> {
    return this.connectionRepo.areConnected(userIdA, userIdB);
  }

  async listReceivedRequests(userId: string): Promise<ConnectionRequestDTO[]> {
    const requests = await this.connectionRepo.listReceivedRequests(userId);
    return this.enrichRequests(requests);
  }

  async listSentRequests(userId: string): Promise<ConnectionRequestDTO[]> {
    const requests = await this.connectionRepo.listSentRequests(userId);
    return this.enrichRequests(requests);
  }

  private async enrichRequests(requests: any[]): Promise<ConnectionRequestDTO[]> {
    const enriched: ConnectionRequestDTO[] = [];
    
    for (const req of requests) {
      const sender = await this.userRepo.findByIdWithProfile(req.senderId);
      if (sender) {
        enriched.push({
          id: req.id,
          senderId: req.senderId,
          senderUsername: sender.profile?.username || 'Unknown',
          senderDisplayName: sender.profile?.displayName || 'Unknown',
          senderAvatarUrl: sender.profile?.avatarUrl || null,
          message: req.message,
          createdAt: req.createdAt,
        });
      }
    }

    return enriched;
  }

  async sendRequest(senderId: string, input: SendConnectionRequestInput): Promise<ConnectionRequestDTO> {
    // Validate receiver exists
    const receiver = await this.userRepo.findById(input.receiverId);
    if (!receiver) {
      throw new NotFoundError('User', input.receiverId);
    }

    // Cannot send to self
    if (input.receiverId === senderId) {
      throw new ValidationError('Cannot send connection request to yourself');
    }

    // Check if already connected
    const alreadyConnected = await this.connectionRepo.areConnected(senderId, input.receiverId);
    if (alreadyConnected) {
      throw new ConflictError('Already connected with this user');
    }

    // Check if request already pending
    const existingRequest = await this.connectionRepo.findPendingRequestBetween(senderId, input.receiverId);
    if (existingRequest) {
      throw new ConflictError('Connection request already pending');
    }

    // Check if blocked
    const isBlocked = await this.isBlocked(input.receiverId, senderId);
    if (isBlocked) {
      throw new ForbiddenError('Cannot send request to this user');
    }

    const request = await this.connectionRepo.createRequest(senderId, input.receiverId, input.message);
    
    const sender = await this.userRepo.findByIdWithProfile(senderId);
    
    logger.info({ senderId, receiverId: input.receiverId, requestId: request.id }, 'Connection request sent');

    return {
      id: request.id,
      senderId: request.senderId,
      senderUsername: sender?.profile?.username || 'Unknown',
      senderDisplayName: sender?.profile?.displayName || 'Unknown',
      senderAvatarUrl: sender?.profile?.avatarUrl || null,
      message: request.message,
      createdAt: request.createdAt,
    };
  }

  async acceptRequest(requestId: string, userId: string): Promise<ConnectionDTO> {
    const request = await this.connectionRepo.findRequestById(requestId);
    if (!request) {
      throw new NotFoundError('Connection Request', requestId);
    }

    // Verify user is the receiver
    if (request.receiverId !== userId) {
      throw new ForbiddenError('Cannot accept this request');
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('Request is not pending');
    }

    // Update request status
    await this.connectionRepo.updateRequestStatus(requestId, 'ACCEPTED');

    // Create connection
    const connection = await this.connectionRepo.create(request.senderId, request.receiverId);

    // Get sender info for response
    const sender = await this.userRepo.findByIdWithProfile(request.senderId);

    logger.info({ requestId, senderId: request.senderId, receiverId: userId }, 'Connection request accepted');

    return {
      id: connection.id,
      userId: request.senderId,
      username: sender?.profile?.username || 'Unknown',
      displayName: sender?.profile?.displayName || 'Unknown',
      avatarUrl: sender?.profile?.avatarUrl || null,
      connectedAt: connection.createdAt,
    };
  }

  async rejectRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.connectionRepo.findRequestById(requestId);
    if (!request) {
      throw new NotFoundError('Connection Request', requestId);
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenError('Cannot reject this request');
    }

    await this.connectionRepo.updateRequestStatus(requestId, 'REJECTED');
    logger.info({ requestId }, 'Connection request rejected');
  }

  async cancelRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.connectionRepo.findRequestById(requestId);
    if (!request) {
      throw new NotFoundError('Connection Request', requestId);
    }

    if (request.senderId !== userId) {
      throw new ForbiddenError('Cannot cancel this request');
    }

    await this.connectionRepo.deleteRequest(requestId);
    logger.info({ requestId }, 'Connection request cancelled');
  }

  // Blocking (simplified - would need BlockedUserRepository for full implementation)
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async listBlockedUsers(userId: string): Promise<string[]> {
    return [];
  }

  async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
    return false;
  }
}
