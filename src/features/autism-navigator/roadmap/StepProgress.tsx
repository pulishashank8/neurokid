import { cn } from '@/lib/utils';
import { roadmapSteps } from '@/features/autism-navigator/data/roadmapData';
import type { StepStatus } from '@/features/autism-navigator/types/roadmap';
import { Check, Circle } from 'lucide-react';

interface StepProgressProps {
  getStepStatus: (stepId: number) => StepStatus;
  onStepClick: (stepId: number) => void;
  activeStep?: number;
}

export function StepProgress({ getStepStatus, onStepClick, activeStep }: StepProgressProps) {
  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'in_progress':
        return <div className="w-2 h-2 rounded-full bg-current animate-pulse" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between gap-2 px-2">
        {roadmapSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isActive = activeStep === step.id;
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => onStepClick(step.id)}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl w-full',
                  'transition-all duration-300 focus-ring',
                  isCompleted && 'bg-primary/10 text-primary',
                  isInProgress && 'bg-primary/5 text-primary ring-2 ring-primary/20',
                  !isCompleted && !isInProgress && isActive && 'bg-muted text-foreground',
                  !isCompleted && !isInProgress && !isActive && 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isInProgress && 'bg-primary/20 text-primary',
                  !isCompleted && !isInProgress && 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'
                )}>
                  {getStatusIcon(status)}
                </span>
                <span className="text-sm font-medium truncate">{step.title}</span>
              </button>

              {index < roadmapSteps.length - 1 && (
                <div className={cn(
                  'w-6 h-0.5 mx-1 shrink-0 rounded-full transition-colors',
                  isCompleted ? 'bg-primary/40' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view */}
      <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex items-center gap-2 min-w-max">
          {roadmapSteps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isActive = activeStep === step.id;
            const isCompleted = status === 'completed';
            const isInProgress = status === 'in_progress';

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => onStepClick(step.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap',
                    'transition-all duration-200 focus-ring',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isInProgress && 'bg-primary/20 text-primary ring-2 ring-primary/30',
                    !isCompleted && !isInProgress && isActive && 'bg-muted text-foreground',
                    !isCompleted && !isInProgress && !isActive && 'bg-muted/50 text-muted-foreground'
                  )}
                >
                  <span className="text-base">{step.icon}</span>
                  <span className="text-sm font-medium">{step.title}</span>
                </button>

                {index < roadmapSteps.length - 1 && (
                  <div className={cn(
                    'w-4 h-0.5 mx-1 rounded-full',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
