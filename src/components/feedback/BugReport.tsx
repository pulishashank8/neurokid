'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bug, AlertCircle } from 'lucide-react';

interface BugReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

const CATEGORIES = [
  { value: 'ui', label: 'UI / Layout' },
  { value: 'functionality', label: 'Feature not working' },
  { value: 'performance', label: 'Slow or crashes' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'content', label: 'Content or accuracy' },
  { value: 'other', label: 'Other' },
];

export function BugReport({ open, onOpenChange, onSubmitted }: BugReportProps) {
  const { data: session, status } = useSession();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (open && status === 'unauthenticated') {
      console.warn('[BugReport] User is not authenticated');
    }
  }, [open, status]);

  const reset = () => {
    setCategory('');
    setTitle('');
    setDescription('');
    setSubmitted(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const submit = async () => {
    console.log('[BugReport] Submit clicked', { 
      title: title.trim(), 
      descLength: description.trim().length,
      authenticated: status === 'authenticated',
      hasSession: !!session
    });
    
    if (!title.trim() || !description.trim() || description.trim().length < 5) {
      console.log('[BugReport] Validation failed');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BUG_REPORT',
          text: `[${category || 'general'}] ${title.trim()}\n\n${description.trim()}`,
          category: category || 'general',
          pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
          metadata: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
        }),
      });
      
      console.log('[BugReport] Response status:', res.status);
      
      if (res.ok) {
        setSubmitted(true);
        onSubmitted?.();
        setTimeout(() => handleOpenChange(false), 1500);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[BugReport] API Error:', res.status, errorData);
        
        const errorMsg = errorData.error || `Server error (${res.status})`;
        setError(errorMsg);
        setSubmitting(false);
      }
    } catch (err) {
      console.error('[BugReport] Network error:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Please check your connection'}`);
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Describe what went wrong so we can fix it. Screenshots can be pasted in the description.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="py-6 text-center text-muted-foreground">Thank you! We&apos;ll look into it.</p>
        ) : (
          <>
            {status === 'unauthenticated' && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Not signed in:</strong> You need to sign in to submit feedback.
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="bug-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="bug-category" className="mt-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bug-title">Brief title</Label>
              <Input
                id="bug-title"
                placeholder="e.g. AAC board freezes on tap"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                maxLength={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bug-desc">Description (min 5 chars)</Label>
              <Textarea
                id="bug-desc"
                placeholder="What happened? What did you expect?"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                maxLength={2000}
                rows={4}
                className="mt-1 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include page path: {typeof window !== 'undefined' ? window.location.pathname : ''}
              </p>
            </div>
          </div>
          </>
        )}

        {!submitted && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={
                !title.trim() || description.trim().length < 5 || submitting
              }
              className="min-w-[100px]"
            >
              {submitting ? 'Sending...' : 'Submit'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
