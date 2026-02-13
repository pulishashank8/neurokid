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
import { Lightbulb } from 'lucide-react';

interface FeatureRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

const CATEGORIES = [
  { value: 'new_feature', label: 'New feature' },
  { value: 'improvement', label: 'Improvement to existing' },
  { value: 'integration', label: 'Integration' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
];

export function FeatureRequest({ open, onOpenChange, onSubmitted }: FeatureRequestProps) {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    if (!title.trim() || !description.trim() || description.trim().length < 5) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'FEATURE_REQUEST',
          text: `[${category || 'general'}] ${title.trim()}\n\n${description.trim()}`,
          category: category || 'general',
          pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
          metadata: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        onSubmitted?.();
        setTimeout(() => handleOpenChange(false), 1500);
      }
    } catch {
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Suggest a Feature
          </DialogTitle>
          <DialogDescription>
            What would make NeuroKid even better? We read every suggestion.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="py-6 text-center text-muted-foreground">Thank you! We&apos;ll consider your idea.</p>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="feature-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="feature-category" className="mt-1">
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
              <Label htmlFor="feature-title">Brief title</Label>
              <Input
                id="feature-title"
                placeholder="e.g. Add dark mode for boards"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                maxLength={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="feature-desc">Description (min 5 chars)</Label>
              <Textarea
                id="feature-desc"
                placeholder="What would this feature do? How would it help?"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                maxLength={2000}
                rows={4}
                className="mt-1 resize-none"
              />
            </div>
          </div>
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
            >
              {submitting ? 'Sending...' : 'Submit'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
