'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bug, Lightbulb, BarChart3 } from 'lucide-react';

export type FeedbackType = 'bug' | 'feature' | 'nps';

interface FeedbackLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: FeedbackType) => void;
}

export function FeedbackLauncher({ open, onOpenChange, onSelect }: FeedbackLauncherProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share feedback</DialogTitle>
          <DialogDescription>
            Help us improve NeuroKid. Choose what you&apos;d like to share.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto py-4 justify-start gap-3"
            onClick={() => {
              onOpenChange(false);
              onSelect('bug');
            }}
          >
            <Bug className="h-5 w-5 shrink-0 text-destructive" />
            <div className="text-left">
              <p className="font-medium">Report a bug</p>
              <p className="text-xs text-muted-foreground">Something isn&apos;t working as expected</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 justify-start gap-3"
            onClick={() => {
              onOpenChange(false);
              onSelect('feature');
            }}
          >
            <Lightbulb className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="text-left">
              <p className="font-medium">Suggest a feature</p>
              <p className="text-xs text-muted-foreground">An idea to make NeuroKid better</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 justify-start gap-3"
            onClick={() => {
              onOpenChange(false);
              onSelect('nps');
            }}
          >
            <BarChart3 className="h-5 w-5 shrink-0 text-violet-500" />
            <div className="text-left">
              <p className="font-medium">Rate us (NPS)</p>
              <p className="text-xs text-muted-foreground">How likely would you recommend us?</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
