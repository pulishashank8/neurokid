"use client";

import dynamic from 'next/dynamic';

const CalmClient = dynamic(() => import('./CalmClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="animate-pulse text-[var(--muted)]">Loading breathing exercises...</div>
    </div>
  ),
});

export default function CalmPage() {
  return <CalmClient />;
}
