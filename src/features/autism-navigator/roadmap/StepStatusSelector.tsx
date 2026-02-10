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
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
      <span className="text-sm font-medium text-[var(--muted)] mr-1">Status:</span>
      <div className="flex flex-wrap gap-1.5">
        {statuses.map(({ value, label, icon }) => (
          <Button
            key={value}
            variant={currentStatus === value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onStatusChange(value)}
            className={cn(
              'gap-1.5 text-xs',
              currentStatus === value && value === 'completed' && 'bg-emerald-600 hover:bg-emerald-500 text-white',
              currentStatus === value && value === 'in_progress' && 'bg-emerald-600/80 hover:bg-emerald-500/80 text-white',
              currentStatus !== value && 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
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
