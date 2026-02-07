import { CursorPaginatedResult } from '@/domain/types';

export interface MessageDTO {
  id: string;
  conversationId: string;
  sender: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
  content?: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface ConversationDTO {
  id: string;
  createdAt: Date;
  lastMessage?: MessageDTO;
  unreadCount: number;
  otherParticipant: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface SendMessageInput {
  recipientId: string;
  content?: string;
  imageUrl?: string;
}

export interface IMessageService {
  sendMessage(senderId: string, input: SendMessageInput): Promise<MessageDTO>;
  listConversations(userId: string, limit: number, offset: number): Promise<ConversationDTO[]>;
  listMessages(userId: string, conversationId: string, cursor?: string, limit?: number): Promise<CursorPaginatedResult<MessageDTO>>;
  getConversation(userId: string, conversationId: string): Promise<ConversationDTO | null>;
  getOrCreateConversation(userId: string, otherUserId: string): Promise<ConversationDTO>;
  deleteMessage(messageId: string, userId: string): Promise<void>;
  blockUser(blockerId: string, blockedId: string): Promise<void>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  isBlocked(userIdA: string, userIdB: string): Promise<boolean>;
}
