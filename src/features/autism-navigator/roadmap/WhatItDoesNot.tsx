import { AlertCircle } from 'lucide-react';

interface WhatItDoesNotProps {
  content: string;
}

export function WhatItDoesNot({ content }: WhatItDoesNotProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 min-w-0">
      <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-[var(--text)]">What This Step Does NOT Do</p>
        <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed break-words">{content}</p>
      </div>
    </div>
  );
}
