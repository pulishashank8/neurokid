'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BugReport } from './BugReport';
import { FeatureRequest } from './FeatureRequest';
import { NPSSurvey } from './NPSSurvey';
import { FeedbackLauncher, type FeedbackType } from './FeedbackLauncher';

/**
 * Floating button for user feedback — Pillar 20
 * Opens a menu: Bug Report, Feature Request, or NPS rating.
 * Hidden on owner dashboard routes.
 */
export function FloatingFeedbackButton() {
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<FeedbackType | null>(null);
  const pathname = usePathname();

  const handleSelect = (type: FeedbackType) => {
    requestAnimationFrame(() => {
      setTimeout(() => setActiveDialog(type), 150);
    });
  };

  const closeActive = () => {
    setActiveDialog(null);
  };

  useEffect(() => {}, []);

  const isOwnerRoute = pathname?.startsWith('/owner') ?? false;

  if (isOwnerRoute) return null;

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setLauncherOpen(true)}
        aria-label="Report a bug, suggest a feature, or give feedback"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
      <FeedbackLauncher
        open={launcherOpen}
        onOpenChange={setLauncherOpen}
        onSelect={handleSelect}
      />
      {activeDialog === 'bug' && (
        <BugReport
          open={true}
          onOpenChange={(o) => !o && closeActive()}
          onSubmitted={closeActive}
        />
      )}
      {activeDialog === 'feature' && (
        <FeatureRequest
          open={true}
          onOpenChange={(o) => !o && closeActive()}
          onSubmitted={closeActive}
        />
      )}
      {activeDialog === 'nps' && (
        <NPSSurvey
          open={true}
          onOpenChange={(o) => !o && closeActive()}
          onSubmitted={closeActive}
        />
      )}
    </>
  );
}
