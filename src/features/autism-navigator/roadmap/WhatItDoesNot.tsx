import { AlertCircle } from 'lucide-react';

interface WhatItDoesNotProps {
  content: string;
}

export function WhatItDoesNot({ content }: WhatItDoesNotProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-sm">What This Step Does NOT Do</p>
        <p className="text-sm text-muted-foreground mt-1">{content}</p>
      </div>
    </div>
  );
}
