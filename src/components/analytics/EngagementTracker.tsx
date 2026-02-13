'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Tracks page views for engagement analytics. Sends real usage data to populate
 * the Owner Engagement dashboard (unique users, most used features, peak hours).
 */
export default function EngagementTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/owner') || pathname.startsWith('/api')) return;

    // Debounce: avoid duplicate tracks for same path
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const featureName = pathname === '/' ? 'home' : pathname.slice(1).split('/')[0] || 'other';

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'page_view',
        featureName,
        metadata: { path: pathname },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
