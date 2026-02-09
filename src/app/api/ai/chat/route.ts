import { NextResponse } from 'next/server';
import { withApiHandler, AuthenticatedRequest } from '@/lib/api';
import { AIJobQueue, ChatMessage } from '@/lib/queue/ai-job-queue';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/domain/errors';
import { checkCostLimits } from '@/lib/ai/cost-limiter';

// POST /api/ai/chat - Enqueue AI chat job for async processing
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const userId = request.session.user.id;
    const body = await request.json();
    const { message, messages, conversationId } = body;

    // Validate input
    if (!message && (!messages || messages.length === 0)) {
      throw new ValidationError('Message or messages array is required');
    }

    // Check cost limits before processing
    const costCheck = await checkCostLimits(userId);
    if (!costCheck.allowed) {
      return NextResponse.json({
        error: costCheck.reason,
        code: 'COST_LIMIT_EXCEEDED',
        usage: costCheck.currentUsage,
        limits: costCheck.limits,
      }, { status: 429 });
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conversation = await prisma.aIConversation.create({
        data: {
          userId,
          title: message?.slice(0, 50) || 'New conversation',
        },
      });
      convId = conversation.id;
    }

    // Build messages array for processing
    let chatMessages: ChatMessage[] = [];
    
    if (messages && messages.length > 0) {
      // Use provided message history
      chatMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));
    } else if (message) {
      // Single message - fetch history if conversation exists
      if (conversationId) {
        const history = await prisma.aIMessage.findMany({
          where: { conversationId: convId },
          orderBy: { createdAt: 'asc' },
          take: 50,
        });
        
        chatMessages = history.map(h => ({
          role: h.role as 'system' | 'user' | 'assistant',
          content: h.content,
        }));
      }
      
      // Add the new user message
      chatMessages.push({ role: 'user', content: message });
    }

    // Save user message to conversation history
    if (message) {
      await prisma.aIMessage.create({
        data: {
          conversationId: convId,
          userId,
          role: 'user',
          content: message,
        },
      });
    }

    // Submit job to async queue
    const jobId = await AIJobQueue.submit(userId, convId, chatMessages);

    // Return job ID immediately for client polling
    return NextResponse.json({
      jobId,
      conversationId: convId,
      status: 'pending',
      message: 'Chat request queued for processing',
      pollUrl: `/api/ai/jobs/${jobId}`,
    });
  },
  {
    method: 'POST',
    routeName: 'POST /api/ai/chat',
    requireAuth: true,
    rateLimit: 'aiChat',
  }
);
