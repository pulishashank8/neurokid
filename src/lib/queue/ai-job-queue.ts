/**
 * Async AI Job Queue
 * 
 * Non-blocking AI chat processing with:
 * - Encrypted message storage
 * - Circuit breaker pattern for AI providers
 * - Automatic retry with exponential backoff
 * - Job status polling
 */

import { prisma } from "@/lib/prisma";
import { FieldEncryption } from "@/lib/encryption";
import { AuditLogger } from "@/lib/audit";

export type AIJobStatus = "pending" | "processing" | "completed" | "failed";

export interface AIJob {
  id: string;
  userId: string;
  conversationId: string;
  status: AIJobStatus;
  result?: string;
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AIJobQueue {
  private static readonly MAX_PROCESSING_TIME = 60000; // 60 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private static readonly CIRCUIT_BREAKER_RESET_MS = 60000; // 1 minute

  // Circuit breaker state
  private static circuitFailures: Map<string, { count: number; lastFailure: number }> = new Map();

  /**
   * Submit a new AI chat job
   */
  static async submit(
    userId: string,
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<string> {
    // Encrypt messages for privacy
    const encryptedMessages = FieldEncryption.encrypt(JSON.stringify(messages));

    if (!encryptedMessages) {
      throw new Error("Failed to encrypt messages");
    }

    const job = await prisma.aIJob.create({
      data: {
        userId,
        conversationId,
        messages: encryptedMessages,
        status: "pending",
        retryCount: 0,
      },
    });

    // Trigger async processing (non-blocking)
    this.processJob(job.id).catch((error) => {
      console.error(`Failed to start job ${job.id}:`, error);
    });

    await AuditLogger.log({
      action: "AI_CHAT_REQUESTED",
      userId,
      resourceType: "AIConversation",
      resourceId: conversationId,
      metadata: { jobId: job.id, messageCount: messages.length },
    });

    return job.id;
  }

  /**
   * Get job status (for client polling)
   */
  static async getStatus(
    jobId: string,
    userId: string
  ): Promise<AIJob | null> {
    const job = await prisma.aIJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) return null;

    return {
      id: job.id,
      userId: job.userId,
      conversationId: job.conversationId,
      status: job.status as AIJobStatus,
      result: job.result ? (FieldEncryption.decrypt(job.result) ?? undefined) : undefined,
      error: job.error || undefined,
      retryCount: job.retryCount,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
    };
  }

  /**
   * Process job asynchronously
   */
  private static async processJob(jobId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Mark as processing
      await prisma.aIJob.update({
        where: { id: jobId },
        data: { status: "processing", startedAt: new Date() },
      });

      // Get job data
      const job = await prisma.aIJob.findUnique({ where: { id: jobId } });
      if (!job) throw new Error("Job not found");

      const messages: ChatMessage[] = JSON.parse(
        FieldEncryption.decrypt(job.messages) || "[]"
      );

      // Call AI with circuit breaker
      const result = await this.callAIWithCircuitBreaker(messages);

      // Encrypt result
      const encryptedResult = FieldEncryption.encrypt(result);

      // Mark as completed
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          result: encryptedResult,
          completedAt: new Date(),
        },
      });

      // Save to conversation history
      await prisma.aIMessage.create({
        data: {
          conversationId: job.conversationId,
          userId: job.userId,
          role: "assistant",
          content: result,
        },
      });

      await AuditLogger.log({
        action: "AI_CHAT_COMPLETED",
        userId: job.userId,
        resourceType: "AIConversation",
        resourceId: job.conversationId,
        metadata: {
          jobId,
          durationMs: Date.now() - startTime,
          tokens: result.length / 4, // Rough estimate
        },
      });
    } catch (error) {
      await this.handleJobFailure(jobId, error);
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private static async handleJobFailure(
    jobId: string,
    error: unknown
  ): Promise<void> {
    const job = await prisma.aIJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (job.retryCount < this.MAX_RETRIES) {
      // Retry with exponential backoff
      const delay = Math.pow(2, job.retryCount) * 1000;
      
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: "pending",
          retryCount: { increment: 1 },
          error: `Retry ${job.retryCount + 1}/${this.MAX_RETRIES}: ${errorMessage}`,
        },
      });

      setTimeout(() => this.processJob(jobId), delay);
    } else {
      // Final failure
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      await AuditLogger.log({
        action: "AI_CHAT_COMPLETED",
        userId: job.userId,
        resourceType: "AIConversation",
        resourceId: job.conversationId,
        metadata: { jobId, error: errorMessage, failed: true },
      });
    }
  }

  /**
   * Call AI with circuit breaker pattern
   */
  private static async callAIWithCircuitBreaker(
    messages: ChatMessage[]
  ): Promise<string> {
    const provider = "groq"; // Primary provider

    // Check circuit breaker
    if (this.isCircuitOpen(provider)) {
      console.warn(`Circuit breaker open for ${provider}, trying fallback`);
      return this.callFallbackAI(messages);
    }

    try {
      const result = await this.callGroq(messages);
      this.recordSuccess(provider);
      return result;
    } catch (error) {
      this.recordFailure(provider);
      console.warn("Groq failed, trying fallback:", error);
      return this.callFallbackAI(messages);
    }
  }

  /**
   * Call Groq API
   */
  private static async callGroq(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "mock-key") {
      throw new Error("GROQ_API_KEY not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Groq HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Empty response from Groq");
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Call fallback AI (Gemini)
   */
  private static async callFallbackAI(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey || apiKey === "mock-key") {
      throw new Error("No AI providers available");
    }

    // Filter out system messages for Gemini
    const geminiMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    const systemMessage = messages.find((m) => m.role === "system");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const url = new URL(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
      );
      url.searchParams.set("key", apiKey);

      const body: any = {
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      };

      if (systemMessage) {
        body.systemInstruction = { parts: [{ text: systemMessage.content }] };
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Gemini HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error("Empty response from Gemini");
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Circuit breaker helpers

  private static isCircuitOpen(provider: string): boolean {
    const state = this.circuitFailures.get(provider);
    if (!state) return false;

    // Reset after cooldown period
    if (Date.now() - state.lastFailure > this.CIRCUIT_BREAKER_RESET_MS) {
      this.circuitFailures.delete(provider);
      return false;
    }

    return state.count >= this.CIRCUIT_BREAKER_THRESHOLD;
  }

  private static recordFailure(provider: string): void {
    const state = this.circuitFailures.get(provider);
    if (state) {
      state.count++;
      state.lastFailure = Date.now();
    } else {
      this.circuitFailures.set(provider, { count: 1, lastFailure: Date.now() });
    }
  }

  private static recordSuccess(provider: string): void {
    this.circuitFailures.delete(provider);
  }
}
