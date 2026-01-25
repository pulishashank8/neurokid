"use client";

import dynamic from 'next/dynamic';

const NewPostClient = dynamic(() => import('./NewPostClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="animate-pulse text-[var(--muted)]">Loading post editor...</div>
    </div>
  ),
});

export default function NewPostPage() {
  return <NewPostClient />;
}
