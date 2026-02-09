import { Connection, ConnectionRequest } from '@/domain/types';

export interface IConnectionRepository {
  // Connections
  findById(id: string): Promise<Connection | null>;
  findBetweenUsers(userA: string, userB: string): Promise<Connection | null>;
  listByUser(userId: string): Promise<Connection[]>;
  create(userA: string, userB: string): Promise<Connection>;
  delete(id: string): Promise<void>;
  
  // Connection Requests
  findRequestById(id: string): Promise<ConnectionRequest | null>;
  findPendingRequestBetween(senderId: string, receiverId: string): Promise<ConnectionRequest | null>;
  listReceivedRequests(userId: string): Promise<ConnectionRequest[]>;
  listSentRequests(userId: string): Promise<ConnectionRequest[]>;
  createRequest(senderId: string, receiverId: string, message?: string): Promise<ConnectionRequest>;
  updateRequestStatus(id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<ConnectionRequest>;
  deleteRequest(id: string): Promise<void>;
  
  // Helpers
  areConnected(userA: string, userB: string): Promise<boolean>;
  hasPendingRequest(senderId: string, receiverId: string): Promise<boolean>;
}
