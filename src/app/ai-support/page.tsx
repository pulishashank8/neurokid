"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Brain, Sparkles, Send, Bot, User, Info, AlertTriangle } from "lucide-react";
import { StoryAssistant } from "@/features/stories/StoryAssistant";
import { BackButton } from "@/components/ui/BackButton";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiSupportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"chat" | "stories">("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your NeuroKid companion. I'm here to help answer questions, suggest resources, or just listen. How can I support you and your family today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/ai-support");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <p className="text-[var(--muted)] animate-pulse">Initializing AI...</p>
        </div>
      </div>
    );
  }

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
        credentials: "include",
        body: JSON.stringify({
          conversationType: "support",
          messages: [...messages, userMsg],
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        const msg = res.status === 401
          ? "Session expired. Please refresh the page and log in again."
          : res.status === 500
            ? "Server error. Please try again, or log out and back in."
            : json.message || json.error || "Failed to send message";
        setMessages((m) => [...m, { role: "assistant", content: msg }]);
        return;
      }

      const jobId = json.jobId;
      if (!jobId) {
        setMessages((m) => [...m, { role: "assistant", content: "Invalid response from server. Please try again." }]);
        return;
      }

      const maxAttempts = 60;
      const pollInterval = 1500;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const pollRes = await fetch(`/api/ai/jobs/${jobId}`, { credentials: "include" });
        const pollData = await pollRes.json();

        if (!pollRes.ok) {
          const pollMsg = pollRes.status === 401
            ? "Session expired. Please refresh the page and log in again."
            : pollData.error || pollData.message || "Failed to get response.";
          setMessages((m) => [...m, { role: "assistant", content: pollMsg }]);
          return;
        }

        if (pollData.status === "completed" && pollData.result) {
          setMessages((m) => [...m, { role: "assistant", content: pollData.result }]);
          return;
        }

        if (pollData.status === "failed") {
          setMessages((m) => [...m, { role: "assistant", content: pollData.error || "Response failed. Please try again." }]);
          return;
        }

        await new Promise((r) => setTimeout(r, pollInterval));
      }

      setMessages((m) => [...m, { role: "assistant", content: "Response is taking too long. Please try again." }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." },
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
    <div className="min-h-screen bg-[var(--background)] pt-24 pb-12 sm:pt-28 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 mb-4 relative z-20">
        <BackButton fallbackPath="/care-compass" />
      </div>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[var(--primary)]/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8 relative z-10 h-[calc(100vh-140px)] flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)] flex items-center gap-3 truncate">
              <div className="flex-shrink-0 p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span>NeuroKid AI</span>
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[var(--muted)] truncate">Your personalized support companion.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-[var(--surface2)]/50 border border-[var(--border)] rounded-2xl backdrop-blur-md">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "chat"
                  ? "bg-[var(--primary)] text-white shadow-lg"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
              >
                <Bot className="w-4 h-4" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab("stories")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "stories"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
              >
                <Sparkles className="w-4 h-4" />
                Stories
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 text-[10px] sm:text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">Not medical advice.</span>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden relative backdrop-blur-sm">
            {/* Main Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  {/* Avatar (Left for AI) */}
                  {m.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md mt-1">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed ${m.role === "assistant"
                    ? "bg-[var(--surface2)] text-[var(--text)] rounded-tl-none border border-[var(--border)]"
                    : "bg-emerald-800 text-white rounded-tr-none font-semibold [text-shadow:0_0_1px_rgba(0,0,0,0.2)]"
                    }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>

                  {/* Avatar (Right for User) */}
                  {m.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mt-1">
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt="User"
                          width={40}
                          height={40}
                          className="w-full h-full rounded-full"
                          unoptimized
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md mt-1">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="bg-[var(--surface2)] px-5 py-4 rounded-2xl rounded-tl-none border border-[var(--border)] flex items-center gap-1.5">
                    <div className="h-2 w-2 bg-[var(--muted)] rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-[var(--muted)] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 bg-[var(--muted)] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-5 bg-[var(--surface2)]/50 border-t border-[var(--border)]">
              <div className="relative flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
                <div className="relative flex-1">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything..."
                    className="w-full pl-4 sm:pl-5 pr-12 py-3 sm:py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none shadow-sm transition-all text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 font-semibold"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-[10px] font-bold text-[var(--muted)] border border-[var(--border)] rounded px-1.5 py-0.5 hidden md:block uppercase tracking-tighter">↵ Ent</span>
                  </div>
                </div>

                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 p-3 sm:p-4 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center text-[10px] font-bold text-[var(--muted)] mt-2 sm:mt-3 uppercase tracking-widest opacity-60">
                AI companion can make mistakes.
              </p>
            </div>
          </div>
        ) : (
          <StoryAssistant />
        )}
      </div>
    </div>
  );
}
