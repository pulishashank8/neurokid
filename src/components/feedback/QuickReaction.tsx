'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuickReactionProps {
  /** Feature/category (e.g. "screening", "ai_chat", "story") */
  category: string;
  /** Optional: current page path for context */
  pagePath?: string;
  /** Callback when submitted */
  onSubmitted?: () => void;
  /** Compact inline style */
  compact?: boolean;
  className?: string;
}

const MAX_TEXT = 200;

export function QuickReaction({
  category,
  pagePath,
  onSubmitted,
  compact = false,
  className,
}: QuickReactionProps) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (r: 1 | -1) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'QUICK_REACTION',
          rating: r,
          text: text.trim() || undefined,
          category,
          pagePath: pagePath ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
        }),
      });
      if (res.ok) {
        setRating(r);
        setSubmitted(true);
        onSubmitted?.();
      }
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
        {rating === 1 ? (
          <ThumbsUp className="h-4 w-4 text-green-500" />
        ) : (
          <ThumbsDown className="h-4 w-4 text-amber-500" />
        )}
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm text-muted-foreground', compact && 'sr-only')}>
          Was this helpful?
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size={compact ? 'icon' : 'sm'}
            onClick={() => submit(1)}
            disabled={submitting}
            className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
          >
            <ThumbsUp className="h-4 w-4" />
            {!compact && <span className="ml-1">Yes</span>}
          </Button>
          <Button
            variant="ghost"
            size={compact ? 'icon' : 'sm'}
            onClick={() => submit(-1)}
            disabled={submitting}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
          >
            <ThumbsDown className="h-4 w-4" />
            {!compact && <span className="ml-1">No</span>}
          </Button>
        </div>
      </div>
      {!compact && (
        <Input
          placeholder="Anything we could improve? (optional)"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
          maxLength={MAX_TEXT}
          className="max-w-xs h-8 text-sm"
        />
      )}
    </div>
  );
}
