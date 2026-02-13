'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const TRAFFIC_PREFIX = 'neurokid_traffic_';

function recordTrafficSource(pathname: string) {
  if (typeof window === 'undefined') return;
  const key = TRAFFIC_PREFIX + pathname;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');

  const params = new URLSearchParams(window.location.search);
  const utm = {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
  };
  const referrer = document.referrer || undefined;

  fetch('/api/analytics/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referrer: referrer || null, landingPage: pathname, ...utm }),
    keepalive: true,
  }).catch(() => {});
}

export default function SessionTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (pathname) recordTrafficSource(pathname);
  }, [pathname]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);
    const handleFocus = () => sendHeartbeat();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [session, status]);

  async function sendHeartbeat() {
    try {
      await fetch('/api/session/heartbeat', { method: 'POST' });
    } catch {
      // Silently fail
    }
  }

  return null;
}
