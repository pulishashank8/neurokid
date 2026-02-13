'use client';

import { useState, useEffect } from 'react';

export function useFeatureFlag(key: string): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/feature-flags')
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d?.flags?.[key])))
      .catch(() => setEnabled(false));
  }, [key]);

  return enabled;
}
