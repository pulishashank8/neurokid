import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StepStatus } from '@/features/autism-navigator/types/roadmap';
import { Circle, Loader2, CheckCircle2 } from 'lucide-react';

interface StepStatusSelectorProps {
  currentStatus: StepStatus;
  onStatusChange: (status: StepStatus) => void;
}

const statuses: { value: StepStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'not_started', label: 'Not Started', icon: <Circle className="w-4 h-4" /> },
  { value: 'in_progress', label: 'In Progress', icon: <Loader2 className="w-4 h-4" /> },
  { value: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export function StepStatusSelector({ currentStatus, onStatusChange }: StepStatusSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <span className="text-sm font-medium text-muted-foreground mr-2">Status:</span>
      <div className="flex gap-1">
        {statuses.map(({ value, label, icon }) => (
          <Button
            key={value}
            variant={currentStatus === value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onStatusChange(value)}
            className={cn(
              'gap-1.5 text-xs',
              currentStatus === value && value === 'completed' && 'bg-primary',
              currentStatus === value && value === 'in_progress' && 'bg-primary/80'
            )}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
