import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IAIService, ChatInput, ChatResult, ChatHistoryItem, ContentSafetyResult, ChatMessage } from '@/domain/interfaces/services/IAIService';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'AIService' });

// Crisis keywords for content safety
const CRISIS_KEYWORDS = [
  'kill', 'murder', 'suicide', 'self-harm', 'cut myself', 'end my life',
  'hurt someone', 'harm', 'abuse', 'weapon', 'gun', 'knife', 'explosive',
  'bomb', 'poison', 'overdose', 'jump off', 'hang myself'
];

// Default NeuroAI system prompt
const DEFAULT_SYSTEM_PROMPT = `You are NeuroAI, a compassionate AI assistant for NeuroKid - supporting autistic children and their families.

Your purpose:
- Provide supportive, understanding responses about autism and neurodiversity
- Help parents understand their child's needs and behaviors
- Offer evidence-based strategies for daily challenges
- Connect families with appropriate resources
- Never provide medical diagnoses or replace professional healthcare advice

Guidelines:
- Use clear, simple language
- Be patient and non-judgmental
- Acknowledge emotions and validate experiences
- Focus on strengths-based approaches
- Keep responses concise but helpful`;

@injectable()
export class AIService implements IAIService {
  private groqApiKey: string | undefined;
  private googleApiKey: string | undefined;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.googleApiKey = process.env.GOOGLE_API_KEY;
  }

  async chat(userId: string, input: ChatInput): Promise<ChatResult> {
    logger.info({ userId, messageCount: input.messages?.length }, 'Processing AI chat');

    let messages: ChatMessage[] = input.messages || [];

    // Handle single message format
    if (input.singleMessage && messages.length === 0) {
      if (input.singleMessage.trim().length === 0) {
        return { reply: '', error: 'Message cannot be empty' };
      }

      // Fetch history if conversationId provided
      if (input.conversationId) {
        const history = await this.getConversationHistory(input.conversationId, 50);
        messages = history.map(h => ({ role: h.role as any, content: h.content }));
      }

      messages.push({ role: 'user', content: input.singleMessage });
    }

    if (messages.length === 0) {
      return { reply: '', error: 'No messages provided' };
    }

    // Content safety check
    const lastMessage = messages.at(-1)?.content?.toLowerCase() || '';
    if (this.detectCrisisContent(lastMessage)) {
      return {
        reply: this.getCrisisResources(),
        provider: 'fallback'
      };
    }

    // Add system prompt if not present
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift({ role: 'system', content: DEFAULT_SYSTEM_PROMPT });
    }

    // Detect story mode for token limits
    const isStoryMode = messages.some(m => 
      m.role === 'system' && m.content.toLowerCase().includes('story')
    );

    // Try AI providers
    let result = await this.tryGroq(messages, isStoryMode);
    
    if (!result && this.googleApiKey) {
      result = await this.tryGemini(messages, isStoryMode);
    }

    if (!result) {
      // Use fallback response
      result = this.getFallbackResponse(messages, isStoryMode);
    }

    // Save to conversation history if conversationId provided
    if (input.conversationId) {
      await this.saveMessage(input.conversationId, userId, 'user', messages.at(-1)?.content || '');
      await this.saveMessage(input.conversationId, userId, 'assistant', result.reply);
    }

    return result;
  }

  private async tryGroq(messages: ChatMessage[], isStoryMode: boolean): Promise<ChatResult | null> {
    if (!this.groqApiKey || this.groqApiKey === 'mock-key') {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          max_tokens: isStoryMode ? 4096 : 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || '';
        if (reply) {
          return { reply, provider: 'groq' };
        }
      } else {
        const errBody = await res.text();
        logger.error({ status: res.status, body: errBody }, 'Groq API error');
      }
    } catch (err) {
      logger.error({ error: err }, 'Groq exception');
    }

    return null;
  }

  private async tryGemini(messages: ChatMessage[], isStoryMode: boolean): Promise<ChatResult | null> {
    if (!this.googleApiKey || this.googleApiKey === 'mock-key') {
      return null;
    }

    try {
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

      const geminiBody: any = {
        contents: conversationHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: isStoryMode ? 4096 : 1024,
        }
      };

      if (systemMessage) {
        geminiBody.systemInstruction = { parts: [{ text: systemMessage.content }] };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (reply) {
          return { reply, provider: 'gemini' };
        }
      }
    } catch (err) {
      logger.error({ error: err }, 'Gemini exception');
    }

    return null;
  }

  private getFallbackResponse(messages: ChatMessage[], isStoryMode: boolean): ChatResult {
    const lastUserMessage = messages.at(-1)?.content?.toLowerCase() || '';

    if (isStoryMode) {
      return {
        reply: "I'm having a little trouble connecting to my story imagination right now. It seems my connection to the cloud is a bit sleepy. Please try checking your internet or asking me again in a moment!",
        provider: 'fallback'
      };
    }

    // Check for specific topics
    const containsWord = (text: string, word: string) => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(text);
    };

    if (containsWord(lastUserMessage, 'fever') || containsWord(lastUserMessage, 'cold') || 
        containsWord(lastUserMessage, 'sick') || containsWord(lastUserMessage, 'ill')) {
      return {
        reply: `I'm sorry to hear your child isn't feeling well. When an autistic child is sick, here are some helpful strategies:

**Comfort Strategies:**
• Stay calm and patient - illness can increase sensory sensitivities
• Maintain familiar routines as much as possible
• Create a comfortable sensory environment (dim lights, soft blankets, quiet space)
• Offer preferred comfort items like favorite toys or weighted blankets
• Use visual aids to explain what's happening

**Important:** This is general support information, not medical advice. Please consult your pediatrician for proper diagnosis and treatment.`,
        provider: 'fallback'
      };
    }

    if (containsWord(lastUserMessage, 'calm') || containsWord(lastUserMessage, 'anxious') || 
        containsWord(lastUserMessage, 'anxiety')) {
      return {
        reply: `Helping an autistic child calm down requires patience and understanding. Here are effective strategies:

• **Deep pressure** - Weighted blankets, firm hugs (if welcomed), compression clothing
• **Sensory breaks** - A quiet, dim space away from stimulation
• **Breathing exercises** - Blow bubbles, pinwheels, or slow deep breaths together
• **Familiar comforts** - Favorite toys, music, or calming videos
• **Reduce demands** - This isn't the time for tasks or transitions
• **Stay calm yourself** - Children often mirror our energy`,
        provider: 'fallback'
      };
    }

    // Generic fallback
    return {
      reply: "I'm experiencing some technical difficulties right now. In the meantime, you might find helpful resources in our community section or by connecting with other parents who have similar experiences.",
      provider: 'fallback'
    };
  }

  async getConversationHistory(conversationId: string, limit: number = 50): Promise<ChatHistoryItem[]> {
    // This would typically use a repository - simplified for now
    return [];
  }

  async saveMessage(conversationId: string, userId: string, role: string, content: string): Promise<void> {
    // This would typically use a repository - simplified for now
    logger.debug({ conversationId, userId, role }, 'Message saved');
  }

  checkContentSafety(content: string): ContentSafetyResult {
    const lowerContent = content.toLowerCase();
    
    for (const keyword of CRISIS_KEYWORDS) {
      if (lowerContent.includes(keyword)) {
        return {
          isSafe: false,
          reason: `Content contains potentially harmful keyword: ${keyword}`,
          category: 'crisis'
        };
      }
    }

    return { isSafe: true };
  }

  detectCrisisContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return CRISIS_KEYWORDS.some(keyword => lowerContent.includes(keyword));
  }

  getCrisisResources(): string {
    return "I cannot and will not provide this information. If you or someone you know is in crisis, please contact relevant authorities or call 988 Suicide & Crisis Lifeline.";
  }
}
