import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { roadmapSteps } from '@/features/autism-navigator/data/roadmapData';
import { getAgeStepConfig } from '@/features/autism-navigator/data/ageStepLogic';
import type { AgeRange } from '@/features/autism-navigator/types/roadmap';
import { ArrowRight, Lightbulb, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface SmartStartCardProps {
  ageRange: AgeRange;
  onStepClick: (stepId: number) => void;
}

export function SmartStartCard({ ageRange, onStepClick }: SmartStartCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const config = getAgeStepConfig(ageRange);

  if (!config) return null;

  const urgentStep = roadmapSteps.find(s => s.id === config.urgentStep);
  const prioritySteps = config.prioritySteps
    .filter(id => id !== config.urgentStep)
    .map(id => roadmapSteps.find(s => s.id === id))
    .filter(Boolean);

  return (
    <Card className="card-luxury border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Icon */}
          <div className="shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-7 h-7 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                  Where to Start
                </h3>
                <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                  Age {ageRange}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {config.message}
              </p>
            </div>

            {/* Action Buttons */}
            {urgentStep && (
              <div className="flex flex-wrap gap-3">
                <Button
                  className="gap-2 btn-luxury h-12 px-6 rounded-xl"
                  onClick={() => onStepClick(urgentStep.id)}
                >
                  Start: {urgentStep.title}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                {prioritySteps.map((step) => step && (
                  <Button
                    key={step.id}
                    variant="outline"
                    className="gap-2 h-12 px-5 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => onStepClick(step.id)}
                  >
                    Also: {step.title}
                  </Button>
                ))}
              </div>
            )}

            {/* Explanation Toggle */}
            <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExplanation ? 'rotate-180' : ''}`} />
                Why these steps for age {ageRange}?
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {config.explanation}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Priority:</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive"></span>
                Urgent
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                Important
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                Can wait
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
