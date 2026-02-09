import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IConnectionRepository } from '@/domain/interfaces/repositories/IConnectionRepository';
import { Connection, ConnectionRequest } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';
import { QUERY_LIMITS } from '@/lib/validation';

@injectable()
export class ConnectionRepository implements IConnectionRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  // Connections
  async findById(id: string): Promise<Connection | null> {
    const connection = await this.prisma.connection.findUnique({
      where: { id },
    });
    return connection ? this.toDomainConnection(connection) : null;
  }

  async findBetweenUsers(userA: string, userB: string): Promise<Connection | null> {
    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { userA, userB },
          { userA: userB, userB: userA },
        ],
      },
    });
    return connection ? this.toDomainConnection(connection) : null;
  }

  async listByUser(userId: string): Promise<Connection[]> {
    const connections = await this.prisma.connection.findMany({
      where: {
        OR: [{ userA: userId }, { userB: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.MAX_LIMIT, // Prevent loading all connections
    });
    return connections.map(c => this.toDomainConnection(c));
  }

  async create(userA: string, userB: string): Promise<Connection> {
    const connection = await this.prisma.connection.create({
      data: { userA, userB },
    });
    return this.toDomainConnection(connection);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.connection.delete({
      where: { id },
    });
  }

  // Connection Requests
  async findRequestById(id: string): Promise<ConnectionRequest | null> {
    const request = await this.prisma.connectionRequest.findUnique({
      where: { id },
    });
    return request ? this.toDomainRequest(request) : null;
  }

  async findPendingRequestBetween(senderId: string, receiverId: string): Promise<ConnectionRequest | null> {
    const request = await this.prisma.connectionRequest.findFirst({
      where: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
    });
    return request ? this.toDomainRequest(request) : null;
  }

  async listReceivedRequests(userId: string): Promise<ConnectionRequest[]> {
    const requests = await this.prisma.connectionRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.MAX_LIMIT, // Prevent loading all requests
    });
    return requests.map(r => this.toDomainRequest(r));
  }

  async listSentRequests(userId: string): Promise<ConnectionRequest[]> {
    const requests = await this.prisma.connectionRequest.findMany({
      where: {
        senderId: userId,
      },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.MAX_LIMIT, // Prevent loading all requests
    });
    return requests.map(r => this.toDomainRequest(r));
  }

  async createRequest(senderId: string, receiverId: string, message?: string): Promise<ConnectionRequest> {
    const request = await this.prisma.connectionRequest.create({
      data: {
        senderId,
        receiverId,
        message,
        status: 'PENDING',
      },
    });
    return this.toDomainRequest(request);
  }

  async updateRequestStatus(id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<ConnectionRequest> {
    const request = await this.prisma.connectionRequest.update({
      where: { id },
      data: { status },
    });
    return this.toDomainRequest(request);
  }

  async deleteRequest(id: string): Promise<void> {
    await this.prisma.connectionRequest.delete({
      where: { id },
    });
  }

  // Helpers
  async areConnected(userA: string, userB: string): Promise<boolean> {
    const count = await this.prisma.connection.count({
      where: {
        OR: [
          { userA, userB },
          { userA: userB, userB: userA },
        ],
      },
    });
    return count > 0;
  }

  async hasPendingRequest(senderId: string, receiverId: string): Promise<boolean> {
    const count = await this.prisma.connectionRequest.count({
      where: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
    });
    return count > 0;
  }

  private toDomainConnection(connection: any): Connection {
    return {
      id: connection.id,
      userA: connection.userA || '',
      userB: connection.userB || '',
      createdAt: connection.createdAt,
    };
  }

  private toDomainRequest(request: any): ConnectionRequest {
    return {
      id: request.id,
      senderId: request.senderId || '',
      receiverId: request.receiverId || '',
      message: request.message ?? undefined,
      status: request.status as 'PENDING' | 'ACCEPTED' | 'REJECTED',
      createdAt: request.createdAt,
    };
  }
}
