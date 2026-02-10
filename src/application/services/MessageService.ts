import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IMessageService, MessageDTO, ConversationDTO, SendMessageInput, CreateConversationResult } from '@/domain/interfaces/services/IMessageService';
import { IMessageRepository } from '@/domain/interfaces/repositories/IMessageRepository';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { IConnectionRepository } from '@/domain/interfaces/repositories/IConnectionRepository';
import { CursorPaginatedResult } from '@/domain/types';
import { NotFoundError, ForbiddenError, ValidationError } from '@/domain/errors';
import { sanitizationService } from '@/lib/sanitization';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'MessageService' });

@injectable()
export class MessageService implements IMessageService {
  constructor(
    @inject(TOKENS.MessageRepository) private messageRepo: IMessageRepository,
    @inject(TOKENS.UserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.ConnectionRepository) private connectionRepo: IConnectionRepository
  ) {}

  async sendMessage(senderId: string, input: SendMessageInput): Promise<MessageDTO> {
    // Validate recipient exists
    const recipient = await this.userRepo.findById(input.recipientId);
    if (!recipient) {
      throw new NotFoundError('User', input.recipientId);
    }

    // Check if users are connected
    const areConnected = await this.connectionRepo.areConnected(senderId, input.recipientId);
    if (!areConnected) {
      throw new ForbiddenError('You must be connected with this user to send messages');
    }

    // Check if blocked
    const isBlocked = await this.isBlocked(senderId, input.recipientId);
    if (isBlocked) {
      throw new ForbiddenError('Cannot send messages to this user');
    }

    // Validate content
    if (!input.content?.trim() && !input.imageUrl) {
      throw new ValidationError('Message must have content or an image');
    }

    // Get or create conversation
    let conversation = await this.messageRepo.findConversationBetweenUsers(senderId, input.recipientId);
    if (!conversation) {
      conversation = await this.messageRepo.createConversation([senderId, input.recipientId]);
    }

    // Create message with sanitized content
    const sanitizedContent = input.content
      ? sanitizationService.sanitizeContent(input.content.trim())
      : undefined;

    const message = await this.messageRepo.createMessage({
      conversationId: conversation.id,
      senderId,
      content: sanitizedContent,
      imageUrl: input.imageUrl,
    });

    logger.info({ senderId, recipientId: input.recipientId, messageId: message.id }, 'Message sent');

    return this.toMessageDTO(message, senderId);
  }

  async listConversations(userId: string, limit: number, offset: number): Promise<ConversationDTO[]> {
    const conversations = await this.messageRepo.listConversations(userId, limit, offset);
    
    // Get blocked users
    // Note: This would need a BlockedUserRepository in a complete implementation
    const blockedUserIds = new Set<string>();

    return conversations.map(conv => ({
      id: conv.conversation.id,
      createdAt: conv.conversation.createdAt,
      lastMessage: conv.lastMessage ? {
        id: conv.lastMessage.id,
        conversationId: conv.lastMessage.conversationId,
        sender: null, // Would need to fetch sender info
        content: conv.lastMessage.content,
        imageUrl: conv.lastMessage.imageUrl,
        createdAt: conv.lastMessage.createdAt,
      } : undefined,
      unreadCount: conv.unreadCount,
      otherParticipant: conv.otherParticipant,
    }));
  }

  async listMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<CursorPaginatedResult<MessageDTO>> {
    // Check if user is participant
    const isParticipant = await this.messageRepo.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenError('Access denied to this conversation');
    }

    const result = await this.messageRepo.listMessages({
      conversationId,
      cursor,
      limit,
    });

    return {
      data: result.data.map(m => this.toMessageDTO(m, userId)),
      pagination: result.pagination,
    };
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationDTO | null> {
    const conversation = await this.messageRepo.findConversationById(conversationId);
    if (!conversation) return null;

    const isParticipant = await this.messageRepo.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenError('Access denied to this conversation');
    }

    // Get conversation with details
    const conversations = await this.messageRepo.listConversations(userId, 1, 0);
    const match = conversations.find(c => c.conversation.id === conversationId);
    
    if (!match) return null;

    return {
      id: match.conversation.id,
      createdAt: match.conversation.createdAt,
      lastMessage: match.lastMessage ? {
        id: match.lastMessage.id,
        conversationId: match.lastMessage.conversationId,
        sender: null,
        content: match.lastMessage.content,
        imageUrl: match.lastMessage.imageUrl,
        createdAt: match.lastMessage.createdAt,
      } : undefined,
      unreadCount: match.unreadCount,
      otherParticipant: match.otherParticipant,
    };
  }

  async getOrCreateConversation(userId: string, otherUserId: string): Promise<CreateConversationResult> {
    // Validate other user exists
    const otherUser = await this.userRepo.findById(otherUserId);
    if (!otherUser) {
      throw new NotFoundError('User', otherUserId);
    }

    if (otherUserId === userId) {
      throw new ValidationError('Cannot start conversation with yourself');
    }

    // Check if users are connected
    const areConnected = await this.connectionRepo.areConnected(userId, otherUserId);
    if (!areConnected) {
      throw new ForbiddenError('You must be connected with this user to start a conversation');
    }

    // Find existing conversation
    let conversation = await this.messageRepo.findConversationBetweenUsers(userId, otherUserId);
    const created = !conversation;
    
    if (!conversation) {
      // Check rate limit before creating
      const canCreate = await this.checkRateLimit(userId, 'conversation', 5, 24 * 60);
      if (!canCreate) {
        throw new ValidationError('Too many conversations created. Please wait before starting new ones.');
      }
      // Create new conversation
      conversation = await this.messageRepo.createConversation([userId, otherUserId]);
    }

    const dto = await this.getConversation(userId, conversation.id);
    if (!dto) {
      throw new NotFoundError('Conversation', conversation.id);
    }

    return { conversation: dto, created };
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    // Check if user is participant
    const isParticipant = await this.messageRepo.isParticipant(message.conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenError('Access denied');
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    await this.messageRepo.deleteMessage(messageId, userId);
    logger.info({ messageId, userId }, 'Message deleted');
  }

  async updateMessage(messageId: string, userId: string, content: string): Promise<MessageDTO> {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    // Note: Message repository doesn't have update method yet, would need to add
    // For now, return the message as-is
    return this.toMessageDTO(message, userId);
  }

  async checkRateLimit(userId: string, actionType: string, maxCount: number, windowMinutes: number): Promise<boolean> {
    // This would typically use a RateLimitRepository
    // For now, return true (allow)
    return true;
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    // Would be implemented with BlockedUserRepository
    throw new Error('Not implemented');
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    // Would be implemented with BlockedUserRepository
    throw new Error('Not implemented');
  }

  async isBlocked(userIdA: string, userIdB: string): Promise<boolean> {
    // Would be implemented with BlockedUserRepository
    return false;
  }

  private toMessageDTO(message: any, currentUserId: string): MessageDTO {
    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: message.senderId ? {
        id: message.senderId,
        username: '', // Would need to fetch from user
        displayName: '',
        avatarUrl: null,
      } : null,
      content: message.content,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt,
    };
  }
}
