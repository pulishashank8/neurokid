"use client";

import { useState } from 'react';
import { useRoadmapState } from '@/features/autism-navigator/hooks/useRoadmapState';
import { roadmapSteps, navigatorFAQs } from '@/features/autism-navigator/data/roadmapData';
import { getOrderedStepsForAge } from '@/features/autism-navigator/data/ageStepLogic';
import { RoadmapIntro } from '@/features/autism-navigator/roadmap/RoadmapIntro';
import { LocationSummary } from '@/features/autism-navigator/roadmap/LocationSummary';
import { RoadmapStep } from '@/features/autism-navigator/roadmap/RoadmapStep';
import { PlainLanguageToggle } from '@/features/autism-navigator/roadmap/PlainLanguageToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Download, RotateCcw, FileText, FileCheck, Sparkles, Map, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRoadmapPDF } from '@/features/autism-navigator/lib/pdfGenerator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SupportNavigator() {
  const {
    location,
    setLocation,
    updateStepStatus,
    getStepStatus,
    plainLanguageMode,
    setPlainLanguageMode,
    resetProgress,
    isLoaded,
  } = useRoadmapState();

  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--muted)] font-medium animate-pulse">Loading your navigator...</p>
        </div>
      </div>
    );
  }

  if (!location || showIntro) {
    return (
      <RoadmapIntro
        onComplete={(data) => {
          setLocation(data);
          setShowIntro(false);
        }}
      />
    );
  }

  const handleStepClick = (stepId: number) => {
    setActiveStep(activeStep === stepId ? null : stepId);
  };

  const handleJoinCommunity = () => {
    router.push('/community');
  };

  const handleDownloadPDF = async (format: 'detailed' | 'quick') => {
    if (!location) return;
    try {
      await generateRoadmapPDF({
        location,
        steps: roadmapSteps,
        getStepStatus,
        format,
      });
      toast({
        title: "Guide Downloaded!",
        description: format === 'detailed'
          ? "Your detailed support guide is ready."
          : "Your quick reference card is ready.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error generating PDF",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your progress? This helps you start fresh.')) {
      resetProgress();
      setShowIntro(true);
    }
  };

  const orderedSteps = getOrderedStepsForAge(location.ageRange);
  const completedCount = orderedSteps.filter(id => getStepStatus(id) === 'completed').length;
  const progressPercentage = Math.round((completedCount / orderedSteps.length) * 100) || 0;
  const nextStepId = orderedSteps.find(id => getStepStatus(id) !== 'completed');
  const nextStep = nextStepId ? roadmapSteps.find(s => s.id === nextStepId) : null;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20 pt-24">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[var(--primary)]/5 to-transparent pointer-events-none" />

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8 animate-fade-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold tracking-wide uppercase mb-3">
              <Map className="w-3 h-3" />
              Support Navigator
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] tracking-tight">
              Your Support Dashboard
            </h1>
            <p className="text-[var(--muted)] mt-2 max-w-xl text-lg">
              Track your progress and access personalized resources for your journey.
            </p>
          </div>

          {/* Toolbar - Moved here to prevent overlap */}
          <div className="flex flex-wrap items-center gap-3">
            <PlainLanguageToggle enabled={plainLanguageMode} onToggle={setPlainLanguageMode} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-[var(--surface)] border-[var(--border)] shadow-sm hover:bg-[var(--surface2)]">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleDownloadPDF('detailed')} className="gap-3 cursor-pointer">
                  <FileText className="w-4 h-4 text-[var(--primary)]" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Detailed Guide</span>
                    <span className="text-[10px] text-[var(--muted)]">Full steps & resources</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadPDF('quick')} className="gap-3 cursor-pointer">
                  <FileCheck className="w-4 h-4 text-[var(--primary)]" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Quick Reference</span>
                    <span className="text-[10px] text-[var(--muted)]">One-page summary</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={handleReset} className="rounded-full hover:bg-[var(--surface2)] text-[var(--muted)]" title="Reset Progress">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Grid - Premium Analytics Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-up" style={{ animationDelay: '100ms' }}>

          {/* Card 1: Circular Progress (Analytics Style) */}
          <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center">
            <div className="relative w-32 h-32 mb-4">
              {/* Background Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-[var(--surface2)]" />
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={351.86} strokeDashoffset={351.86 - (351.86 * progressPercentage) / 100} className="text-[var(--primary)] transition-all duration-1000 ease-out" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-black text-[var(--text)]">{progressPercentage}%</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-[var(--text)]">Overall Progress</h3>
            <p className="text-sm text-[var(--muted)]">{completedCount} of {orderedSteps.length} steps completed</p>
          </div>

          {/* Card 2: Next Step Focus */}
          <div className="md:col-span-1 group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-[var(--primary)] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Up Next
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-2 line-clamp-2">
                {nextStep ? nextStep.title : "All steps completed!"}
              </h3>
              <p className="text-sm text-[var(--muted)] line-clamp-3">
                {nextStep ? nextStep.description : "You've finished the recommended roadmap. Great job!"}
              </p>
            </div>

            {nextStep && (
              <Button
                onClick={() => handleStepClick(nextStep.id)}
                className="mt-4 w-full bg-[var(--text)] text-[var(--background)] hover:bg-[var(--text)]/90"
              >
                Continue Journey
              </Button>
            )}

            {/* Decorative Glow */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--primary)]/10 blur-3xl rounded-full pointer-events-none" />
          </div>

          {/* Card 3: Profile Summary */}
          <div className="flex flex-col gap-4">
            {/* Location Card */}
            <div className="flex-1 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--muted)] font-bold uppercase">Location</p>
                <p className="text-sm font-semibold truncate text-[var(--text)]">{location.county}, {location.state}</p>
                <p className="text-xs text-[var(--muted)]">{location.zipCode}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowIntro(true)} className="text-[var(--muted)] hover:text-[var(--primary)]">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Age Card */}
            <div className="flex-1 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--muted)] font-bold uppercase">Child Age</p>
                <p className="text-sm font-semibold text-[var(--text)]">{location.ageRange} Years Old</p>
                <p className="text-xs text-[var(--muted)]">Tailored Plan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-sm font-black text-[var(--muted)] uppercase tracking-[0.3em]">The Care Path</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {orderedSteps.map((stepId, index) => {
            const step = roadmapSteps.find(s => s.id === stepId);
            if (!step) return null;

            return (
              <div
                key={step.id}
                className="animate-fade-up"
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <RoadmapStep
                  step={step}
                  status={getStepStatus(step.id)}
                  onStatusChange={(status) => updateStepStatus(step.id, status)}
                  location={location}
                  isActive={activeStep === step.id}
                  onToggle={() => handleStepClick(step.id)}
                  plainLanguageMode={plainLanguageMode}
                  onJoinCommunity={handleJoinCommunity}
                />
              </div>
            );
          })}
        </div>

        {/* 30 FAQs Section: Premium Grid */}
        <div className="mt-24 space-y-12 animate-fade-up">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary to-purple-600">
              Answers for your Journey
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-bold text-lg">
              30 Common questions asked by families navigating the autism path with NeuroKid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navigatorFAQs.map((faq: { q: string, a: string }, i: number) => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {i + 1}
                </div>
                <h4 className="font-bold text-slate-900 mb-2 leading-tight">{faq.q}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Community Hub Invitation */}
        <div className="mt-24 p-1 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-purple-500/20">
          <div className="bg-white rounded-[1.4rem] p-10 md:p-16 text-center space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
              <Users className="w-64 h-64" />
            </div>

            <div className="space-y-4 relative z-10">
              <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 text-xs tracking-widest uppercase">The NeuroKid Circle</Badge>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-emerald-500 animate-gradient">
                You are not alone.
              </h2>
              <p className="text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed font-bold">
                Join a premium membership of parents on the same exact path.
                Real connection, shared wisdom, and direct support.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-center">
              <Button onClick={handleJoinCommunity} size="lg" className="h-20 px-16 rounded-3xl bg-slate-900 text-white hover:bg-slate-800 text-xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-105 transition-all">
                Join Community Hub
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pb-12 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-xl mb-8">
            NeuroKid — Premium Autism Navigation
          </div>

          <div className="select-none pointer-events-none mt-8">
            <p className="text-[8px] font-thin tracking-widest text-[#f8fafc]/5 transition-opacity hover:opacity-100 duration-1000">
              This is a personal project created by Shashank Puli.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
