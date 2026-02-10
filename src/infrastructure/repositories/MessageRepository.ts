import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IMessageRepository, CreateMessageInput, ListMessagesQuery, ConversationWithLastMessage } from '@/domain/interfaces/repositories/IMessageRepository';
import { Message, Conversation, CursorPaginatedResult } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';
import { normalizeLimit, QUERY_LIMITS } from '@/lib/validation';

@injectable()
export class MessageRepository implements IMessageRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Message | null> {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });
    return message ? this.toDomainMessage(message) : null;
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    return conversation ? this.toDomainConversation(conversation) : null;
  }

  async findConversationBetweenUsers(userIdA: string, userIdB: string): Promise<Conversation | null> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userIdA } } },
          { participants: { some: { userId: userIdB } } },
        ],
      },
    });
    return conversation ? this.toDomainConversation(conversation) : null;
  }

  async listMessages(query: ListMessagesQuery): Promise<CursorPaginatedResult<Message>> {
    // Cap messages at MAX_MESSAGES (50) to prevent loading too many
    const limit = Math.min(normalizeLimit(query.limit), QUERY_LIMITS.MAX_MESSAGES);

    const messages = await this.prisma.message.findMany({
      where: { conversationId: query.conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });

    const hasMore = messages.length > limit;
    const data = messages.slice(0, limit);
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : undefined;

    return {
      data: data.map(m => this.toDomainMessage(m)).reverse(),
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }

  async listConversations(userId: string, limit: number, offset: number): Promise<ConversationWithLastMessage[]> {
    const normalizedLimit = normalizeLimit(limit);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      orderBy: { createdAt: 'desc' },
      take: normalizedLimit,
      skip: offset,
      include: {
        participants: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== userId)?.user;
      const lastMessage = conv.messages[0];

      return {
        conversation: this.toDomainConversation(conv),
        lastMessage: lastMessage ? this.toDomainMessage(lastMessage) : undefined,
        unreadCount: 0, // Would need to track read status
        otherParticipant: {
          id: otherParticipant?.id || '',
          username: otherParticipant?.profile?.username || 'Unknown',
          displayName: otherParticipant?.profile?.displayName || 'Unknown',
          avatarUrl: otherParticipant?.profile?.avatarUrl || null,
        },
      };
    });
  }

  async createMessage(data: CreateMessageInput): Promise<Message> {
    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        imageUrl: data.imageUrl,
      },
    });
    return this.toDomainMessage(message);
  }

  async createConversation(participantIds: string[]): Promise<Conversation> {
    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: participantIds.map(userId => ({ userId })),
        },
      },
    });
    return this.toDomainConversation(conversation);
  }

  async deleteMessage(id: string, userId: string): Promise<void> {
    await this.prisma.message.delete({
      where: { id },
    });
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.conversationParticipant.count({
      where: {
        conversationId,
        userId,
      },
    });
    return count > 0;
  }

  private toDomainMessage(message: any): Message {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content ?? undefined,
      imageUrl: message.imageUrl ?? undefined,
      createdAt: message.createdAt,
    };
  }

  private toDomainConversation(conversation: any): Conversation {
    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      participantIds: [], // Would need to populate from participants relation
    };
  }
}
