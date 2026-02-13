'use client';

import { useEffect } from 'react';
import { initErrorTracker } from '@/lib/error-tracker';

export default function ErrorTrackerInit() {
  useEffect(() => {
    initErrorTracker();
  }, []);
  return null;
}
