import { Message, Conversation, CursorPaginatedResult } from '@/domain/types';

export interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  content?: string;
  imageUrl?: string;
}

export interface ListMessagesQuery {
  conversationId: string;
  cursor?: string;
  limit: number;
}

export interface ConversationWithLastMessage {
  conversation: Conversation;
  lastMessage?: Message;
  unreadCount: number;
  otherParticipant: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface IMessageRepository {
  findById(id: string): Promise<Message | null>;
  findConversationById(id: string): Promise<Conversation | null>;
  findConversationBetweenUsers(userIdA: string, userIdB: string): Promise<Conversation | null>;
  listMessages(query: ListMessagesQuery): Promise<CursorPaginatedResult<Message>>;
  listConversations(userId: string, limit: number, offset: number): Promise<ConversationWithLastMessage[]>;
  createMessage(data: CreateMessageInput): Promise<Message>;
  createConversation(participantIds: string[]): Promise<Conversation>;
  deleteMessage(id: string, userId: string): Promise<void>;
  isParticipant(conversationId: string, userId: string): Promise<boolean>;
}
