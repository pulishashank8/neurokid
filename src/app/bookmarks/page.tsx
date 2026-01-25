"use client";

import dynamic from 'next/dynamic';

const BookmarksClient = dynamic(() => import('./BookmarksClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="animate-pulse text-[var(--muted)]">Loading bookmarks...</div>
    </div>
  ),
});

export default function BookmarksPage() {
  return <BookmarksClient />;
}
