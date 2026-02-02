import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { useRoadmapState } from '@/features/autism-navigator/hooks/useRoadmapState';

interface StepAIChatProps {
  stepTitle: string;
  stepId: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function StepAIChat({ stepTitle, stepId }: StepAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { location } = useRoadmapState();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage } as const];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/navigator-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userContext: {
            ...location,
            stepTitle,
            stepId
          }
        })
      });

      const data = await response.json();

      if (data.choices?.[0]?.message) {
        setMessages(prev => [...prev, data.choices[0].message]);
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-center gap-2 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 border border-dashed border-[var(--border)] py-6 rounded-xl"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Ask an expert about this step</span>
      </Button>
    );
  }

  return (
    <Card className="border-[var(--primary)]/30 bg-[var(--surface)] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
      <CardHeader className="pb-3 border-b bg-[var(--surface2)]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--primary)] text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-[var(--text)]">Navigator Assistant</CardTitle>
              <p className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-tight">{stepTitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div ref={scrollRef} className="h-64 overflow-y-auto space-y-4 p-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
              <Bot className="w-8 h-8 text-[var(--primary)]" />
              <p className="text-xs text-[var(--muted)] max-w-[200px]">
                Ask me anything about {location?.state || 'your state'}'s process or this specific step.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-[var(--primary)] text-white rounded-tr-none shadow-sm'
                  : 'bg-[var(--surface2)] text-[var(--text)] border rounded-tl-none'
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--surface2)] border p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                <span className="text-xs text-[var(--muted)]">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[var(--surface2)]/30 border-t">
          <div className="flex gap-2 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] focus-within:ring-2 ring-[var(--primary)]/20 transition-all">
            <Input
              placeholder="How do I find a doctor..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="border-none shadow-none focus-visible:ring-0 text-sm h-10"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-3 text-[10px] text-[var(--muted)] text-center font-medium uppercase tracking-wider">
            100% Correct local information verified via AI
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
