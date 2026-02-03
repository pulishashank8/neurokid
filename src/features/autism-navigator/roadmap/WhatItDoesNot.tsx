import { AlertCircle } from 'lucide-react';

interface WhatItDoesNotProps {
  content: string;
}

export function WhatItDoesNot({ content }: WhatItDoesNotProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-sm text-slate-200">What This Step Does NOT Do</p>
        <p className="text-sm text-slate-400 mt-1">{content}</p>
      </div>
    </div>
  );
}
