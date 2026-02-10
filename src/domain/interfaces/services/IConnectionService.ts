import { Connection, ConnectionRequest } from '@/domain/types';

export interface ConnectionDTO {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  connectedAt: Date;
}

export interface ConnectionRequestDTO {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  message?: string;
  createdAt: Date;
}

export interface SendConnectionRequestInput {
  receiverId: string;
  message?: string;
}

export interface IConnectionService {
  // Connections
  listConnections(userId: string): Promise<ConnectionDTO[]>;
  removeConnection(userId: string, connectionId: string): Promise<void>;
  areConnected(userIdA: string, userIdB: string): Promise<boolean>;

  // Connection Requests
  listReceivedRequests(userId: string): Promise<ConnectionRequestDTO[]>;
  listSentRequests(userId: string): Promise<ConnectionRequestDTO[]>;
  sendRequest(senderId: string, input: SendConnectionRequestInput): Promise<ConnectionRequestDTO>;
  acceptRequest(requestId: string, userId: string): Promise<ConnectionDTO>;
  rejectRequest(requestId: string, userId: string): Promise<void>;
  cancelRequest(requestId: string, userId: string): Promise<void>;

  // Blocking
  blockUser(blockerId: string, blockedId: string): Promise<void>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  listBlockedUsers(userId: string): Promise<string[]>;
  isBlocked(userId: string, otherUserId: string): Promise<boolean>;
}
