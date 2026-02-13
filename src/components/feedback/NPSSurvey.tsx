'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface NPSSurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Trigger context e.g. "monthly check-in" */
  triggerContext?: string;
  onSubmitted?: () => void;
}

const LABELS = ['Not at all', '2', '3', '4', '5', '6', '7', '8', '9', 'Extremely likely'];

export function NPSSurvey({ open, onOpenChange, triggerContext, onSubmitted }: NPSSurveyProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [whyText, setWhyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (rating == null || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NPS',
          rating,
          text: whyText.trim() || undefined,
          category: triggerContext,
          pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        onSubmitted?.();
        setTimeout(() => onOpenChange(false), 1500);
      }
    } catch {
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How likely are you to recommend NeuroKid?</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve. On a scale of 0 (not at all) to 10 (extremely likely).
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="py-6 text-center text-muted-foreground">Thank you for your feedback!</p>
        ) : (
          <>
            <div className="grid grid-cols-11 gap-1 py-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <Button
                  key={n}
                  variant={rating === n ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'min-w-0',
                    n <= 6 && 'border-red-200 dark:border-red-900',
                    n >= 7 && n <= 8 && 'border-amber-200 dark:border-amber-900',
                    n >= 9 && 'border-green-200 dark:border-green-900'
                  )}
                  onClick={() => setRating(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {rating != null ? LABELS[rating] : 'Select a score'}
            </p>

            {rating != null && (
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Why did you choose this score? (optional)</label>
                <Textarea
                  placeholder="Share more if you like..."
                  value={whyText}
                  onChange={(e) => setWhyText(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Skip
              </Button>
              <Button onClick={submit} disabled={rating == null || submitting}>
                {submitting ? 'Sending...' : 'Submit'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
