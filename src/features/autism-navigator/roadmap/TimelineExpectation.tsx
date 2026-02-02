import { Clock } from 'lucide-react';

interface TimelineExpectationProps {
  timeline: string;
}

export function TimelineExpectation({ timeline }: TimelineExpectationProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50 border border-accent">
      <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-sm">Expected Timeline</p>
        <p className="text-sm text-muted-foreground mt-1">{timeline}</p>
      </div>
    </div>
  );
}
