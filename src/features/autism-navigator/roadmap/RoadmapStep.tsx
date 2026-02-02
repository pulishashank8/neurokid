import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RoadmapStep as RoadmapStepType, StepStatus, LocationData } from '@/features/autism-navigator/types/roadmap';
import { ChevronDown, AlertCircle, Star, Search, MapPin, ExternalLink, Users, ShieldCheck, Heart, Sparkles, GraduationCap, CheckCircle2, MessageSquareText } from 'lucide-react';
import { WhatItDoesNot } from './WhatItDoesNot';
import { EmotionalSupport } from './EmotionalSupport';
import { IntegratedProviderSearch } from './IntegratedProviderSearch';
import { MedicaidContactCard } from './MedicaidContactCard';
import { StepStatusSelector } from './StepStatusSelector';
import { StepAIChat } from './StepAIChat';
import { isStepRecommendedForAge } from '@/features/autism-navigator/data/ageStepLogic';
import { ResourceFinder } from '@/features/autism-navigator/utils/ResourceFinder';

interface RoadmapStepProps {
  step: RoadmapStepType;
  status: StepStatus;
  onStatusChange: (status: StepStatus) => void;
  location: LocationData;
  isActive: boolean;
  onToggle: () => void;
  plainLanguageMode: boolean;
  onJoinCommunity: () => void;
}

const stepIcons: Record<number, any> = {
  1: ShieldCheck,
  2: Heart,
  3: ExternalLink,
  4: GraduationCap,
  5: Users,
};

export function RoadmapStep({
  step,
  status,
  onStatusChange,
  location,
  isActive,
  onToggle,
  onJoinCommunity
}: RoadmapStepProps) {
  const Icon = stepIcons[step.id] || Sparkles;
  const recommendation = isStepRecommendedForAge(step.id, location.ageRange);

  const priorityBadge = {
    urgent: { label: 'Urgent', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
    priority: { label: 'Priority', className: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 },
    optional: null,
  }[recommendation];

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-500 border-none bg-white/40 backdrop-blur-xl shadow-2xl hover:shadow-primary/5',
      status === 'completed' && 'bg-primary/5',
      status === 'in_progress' && 'ring-1 ring-primary/20',
      isActive && 'scale-[1.01]'
    )}>
      {status !== 'not_started' && (
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1.5',
          status === 'completed' && 'bg-gradient-to-r from-primary to-primary/40',
          status === 'in_progress' && 'bg-gradient-to-r from-primary/40 to-transparent'
        )} />
      )}

      <Collapsible open={isActive} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full text-left focus-ring">
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className={cn(
                  'shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm',
                  status === 'completed' && 'bg-primary text-white scale-95 shadow-lg',
                  status === 'in_progress' && 'bg-primary/10 text-primary animate-pulse',
                  status === 'not_started' && 'bg-slate-100 text-slate-400'
                )}>
                  <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">
                      {step.title}
                    </CardTitle>
                    {priorityBadge && status === 'not_started' && (
                      <Badge variant="outline" className={cn('text-[10px] gap-1 font-black uppercase tracking-widest px-2 py-0.5 border-2', priorityBadge.className)}>
                        <priorityBadge.icon className="w-3 h-3" />
                        {priorityBadge.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors">
                <ChevronDown className={cn('w-6 h-6 transition-transform duration-500', isActive && 'rotate-180')} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-8 space-y-8 px-6">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* Status Selector */}
            <StepStatusSelector currentStatus={status} onStatusChange={onStatusChange} />

            {/* Action Buttons: Premium Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {step.id === 1 && (
                <Button className="h-auto py-4 px-6 justify-start gap-4 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl group transition-all" asChild>
                  <a href="/screening">
                    <div className="p-2 rounded-xl bg-white/20 group-hover:scale-110 transition-transform"><Search className="w-5 h-5" /></div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest opacity-80">Phase 1</p>
                      <p className="text-base font-bold">Start M-CHAT-R/F</p>
                    </div>
                  </a>
                </Button>
              )}

              {step.id === 2 && (
                <>
                  <Button variant="outline" className="h-auto py-4 px-6 justify-start gap-4 border-2 border-slate-200 hover:border-primary/20 hover:bg-primary/5 rounded-2xl transition-all" asChild>
                    <a href={ResourceFinder.getPediatricianLink(location.zipCode)} target="_blank">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600"><MapPin className="w-5 h-5" /></div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Search</p>
                        <p className="text-base font-bold text-slate-800">Local Pediatricians</p>
                      </div>
                    </a>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 px-6 justify-start gap-4 border-2 border-slate-200 hover:border-primary/20 hover:bg-primary/5 rounded-2xl transition-all" asChild>
                    <a href={ResourceFinder.getSpecialistLink(location.zipCode)} target="_blank">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600"><Sparkles className="w-5 h-5" /></div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Referral</p>
                        <p className="text-base font-bold text-slate-800">Find Specialists</p>
                      </div>
                    </a>
                  </Button>
                </>
              )}

              {step.id === 3 && (
                <Button className="h-auto py-4 px-6 justify-start gap-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200/50 rounded-2xl group transition-all !text-white border-none" asChild>
                  <a href={ResourceFinder.getMedicaidLink(location.state)} target="_blank">
                    <div className="p-2 rounded-xl bg-white/20 group-hover:scale-110 transition-transform"><ShieldCheck className="w-5 h-5 text-white" /></div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-50">Government</p>
                      <p className="text-base font-extrabold text-white">{location.state} Medicaid</p>
                    </div>
                  </a>
                </Button>
              )}

              {step.id === 4 && (
                <>
                  <Button variant="outline" className="h-auto py-4 px-6 justify-start gap-4 border-2 border-slate-200 hover:border-primary/20 hover:bg-primary/5 rounded-2xl transition-all" asChild>
                    <a href={`https://www.google.com/search?q=ABA+therapy+near+${location.zipCode}`} target="_blank">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600"><Search className="w-5 h-5" /></div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Provider</p>
                        <p className="text-base font-bold text-slate-800">Find ABA Therapy</p>
                      </div>
                    </a>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 px-6 justify-start gap-4 border-2 border-slate-200 hover:border-primary/20 hover:bg-primary/5 rounded-2xl transition-all" asChild>
                    <a href={`https://www.google.com/search?q=${location.county}+county+school+district+child+find`} target="_blank">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600"><GraduationCap className="w-5 h-5" /></div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">IEP Support</p>
                        <p className="text-base font-bold text-slate-800">Local Child Find</p>
                      </div>
                    </a>
                  </Button>
                </>
              )}

              {step.id === 5 && (
                <Button onClick={onJoinCommunity} className="h-auto py-5 px-8 justify-center gap-4 bg-slate-900 hover:bg-slate-800 text-white shadow-2xl rounded-2xl w-full group transition-all">
                  <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-bold">Join the NeuroKid Community</span>
                </Button>
              )}
            </div>

            {/* Integrated Doctor Guidance Section */}
            {step.doctorInstructions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Users className="w-5 h-5" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Specialists to Seek</h4>
                  </div>
                  <div className="space-y-3">
                    {step.doctorInstructions.types.map((type, i) => (
                      <div key={i} className="flex gap-3 text-sm font-medium text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <MessageSquareText className="w-5 h-5" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Questions to Ask</h4>
                  </div>
                  <div className="space-y-3">
                    {step.doctorInstructions.questions.map((q, i) => (
                      <div key={i} className="flex gap-3 text-sm font-medium text-slate-600 italic">
                        <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0 border-primary/20 text-primary text-[10px]">{i + 1}</Badge>
                        "{q}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Specialized Content Cards */}
            {step.id === 2 && (
              <IntegratedProviderSearch zipCode={location.zipCode} />
            )}
            {step.id === 3 && (
              <MedicaidContactCard state={location.state} county={location.county} />
            )}
            {step.id === 4 && (
              <IntegratedProviderSearch zipCode={location.zipCode} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Compassionate Guidance</h4>
                <EmotionalSupport message={step.emotionalSupport || "One step at a time. You've got this."} onJoinCommunity={onJoinCommunity} />
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Important Note</h4>
                <WhatItDoesNot content={step.whatItDoesNot} />
              </div>
            </div>

            <StepAIChat stepTitle={step.title} stepId={step.id} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
