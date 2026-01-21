"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiSupportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your NeuroKind support companion. I can offer general guidance and helpful suggestions. Please remember this is not medical advice—for emergencies or serious concerns, contact a qualified professional.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect to scroll to bottom - MUST be called before any conditional returns
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Redirect to login if not authenticated - AFTER all hooks
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/ai-support");
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  async function send() {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const json = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: json.reply,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-6 sm:pt-24 sm:pb-12 bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">AI Support</h1>
          <p className="mt-2 text-base sm:text-lg text-[var(--muted)]">
            Chat with our AI companion for general guidance and suggestions.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="mb-6 rounded-lg border border-[var(--warning)] bg-[var(--warning-bg)] p-4">
          <div className="flex gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--warning)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Important Notice</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                This AI companion provides general guidance only and is not a substitute
                for professional medical advice. For emergencies or serious health
                concerns, contact a qualified healthcare provider immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-md)] h-[400px] sm:h-[500px] md:h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`w-full py-6 px-4 sm:px-6 ${m.role === "assistant"
                    ? "bg-[var(--surface)]"
                    : "bg-[var(--background)]"
                  }`}
              >
                {m.role === "assistant" ? (
                  // AI Message - Full width with avatar on left
                  <div className="max-w-3xl mx-auto flex gap-4 sm:gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-emerald-500 text-white text-sm sm:text-base font-semibold">
                        🧠
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base leading-7 font-normal text-[var(--text)]">
                        {m.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  // User Message - Right-aligned bubble
                  <div className="max-w-3xl mx-auto flex justify-end">
                    <div className="max-w-[70%] rounded-3xl bg-[#2f2f2f] text-white px-5 py-3">
                      <div className="text-sm sm:text-base leading-6">
                        {m.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="w-full py-6 px-4 sm:px-6 bg-[var(--background)]">
                <div className="max-w-3xl mx-auto flex gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-emerald-500 text-white text-sm sm:text-base">
                      🧠
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)]"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)]"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)]"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)] px-3 py-2 text-sm shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] min-h-[44px] placeholder:text-[var(--muted)]"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] min-w-[70px]"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 rounded-lg bg-[var(--info-bg)] p-4 border border-[var(--info)]">
          <p className="text-xs sm:text-sm text-[var(--text)]">
            💡 Tip: Use clear questions and provide context for better guidance.
            Our AI learns from your feedback to improve responses.
          </p>
        </div>
      </div>
    </div>
  );
}
