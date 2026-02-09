export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatInput {
  messages: ChatMessage[];
  conversationId?: string;
  singleMessage?: string;
}

export interface ChatResult {
  reply: string;
  error?: string;
  provider?: 'groq' | 'gemini' | 'fallback';
}

export interface ChatHistoryItem {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

export interface ContentSafetyResult {
  isSafe: boolean;
  reason?: string;
  category?: string;
}

export interface IAIService {
  chat(userId: string, input: ChatInput): Promise<ChatResult>;
  getConversationHistory(conversationId: string, limit?: number): Promise<ChatHistoryItem[]>;
  saveMessage(conversationId: string, userId: string, role: string, content: string): Promise<void>;
  checkContentSafety(content: string): ContentSafetyResult;
  detectCrisisContent(content: string): boolean;
  getCrisisResources(): string;
}
