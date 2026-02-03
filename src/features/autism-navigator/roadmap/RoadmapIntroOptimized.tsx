'use client';

import { useState, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usStates, getCountiesByState } from '@/features/autism-navigator/data/roadmapData';
import { getAgeStepConfig } from '@/features/autism-navigator/data/ageStepLogic';
import { getStateAbbreviation } from '@/features/autism-navigator/data/usStateAbbreviations';
import type { LocationData, AgeRange } from '@/features/autism-navigator/types/roadmap';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import heavy zipcodes library
const zipcodes = lazy(() => import('zipcodes'));

interface RoadmapIntroProps {
  onComplete: (data: LocationData) => void;
}

// Skeleton component for loading state
function FormSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-full" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

export function RoadmapIntroOptimized({ onComplete }: RoadmapIntroProps) {
  const [ageRange, setAgeRange] = useState<AgeRange | ''>('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [zipcodesLib, setZipcodesLib] = useState<typeof import('zipcodes') | null>(null);
  const [isLoadingZip, setIsLoadingZip] = useState(false);

  // Lazy load zipcodes library when needed
  const loadZipcodes = async () => {
    if (!zipcodesLib && !isLoadingZip) {
      setIsLoadingZip(true);
      const lib = await import('zipcodes');
      setZipcodesLib(lib);
      setIsLoadingZip(false);
      return lib;
    }
    return zipcodesLib;
  };

  const selectedStateAbbr = useMemo(() => (state ? getStateAbbreviation(state) : null), [state]);
  const counties = state ? getCountiesByState(state) : [];

  const zipLookup = useMemo(() => {
    if (zipCode.length !== 5 || !zipcodesLib) return null;
    return zipcodesLib.lookup(zipCode);
  }, [zipCode, zipcodesLib]);

  const zipError = useMemo(() => {
    if (!state || !county) return null;
    if (zipCode.length === 0) return null;
    if (zipCode.length < 5) return 'ZIP code must be 5 digits.';
    if (!selectedStateAbbr) return null;
    if (!zipcodesLib) return null;
    if (!zipLookup?.state) return 'ZIP code not recognized. Please double-check.';
    if (zipLookup.state !== selectedStateAbbr) {
      return `That ZIP code belongs to ${zipLookup.state}, not ${selectedStateAbbr}. Please enter a ZIP from ${state}.`;
    }
    return null;
  }, [state, county, zipCode, selectedStateAbbr, zipLookup, zipcodesLib]);

  const ageConfig = ageRange ? getAgeStepConfig(ageRange as AgeRange) : null;

  const isValid = Boolean(ageRange && state && county && zipCode.length === 5 && !zipError && zipcodesLib);

  const handleZipCodeFocus = () => {
    if (!zipcodesLib) {
      loadZipcodes();
    }
  };

  const handleZipCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 5);
    setZipCode(cleaned);
    if (cleaned.length === 5 && !zipcodesLib) {
      loadZipcodes();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onComplete({
      ageRange: ageRange as AgeRange,
      country: 'United States',
      state,
      county,
      zipCode,
    });
  };

  const currentStep = !ageRange ? 1 : !state ? 2 : !county ? 3 : 4;

  return (
    <div className="min-h-screen flex flex-col gradient-subtle">
      {/* Decorative background */}
      <div className="fixed inset-0 dot-pattern opacity-30 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 pt-20">
        <div className="w-full max-w-xl relative z-10">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Personalized for your family
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-4 text-balance">
              Let&apos;s Build Your Roadmap
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Tell us a bit about your child and location to get personalized guidance and local resources.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-500 ${step < currentStep
                  ? 'w-8 bg-primary'
                  : step === currentStep
                    ? 'w-8 bg-primary/60'
                    : 'w-4 bg-border'
                  }`}
              />
            ))}
          </div>

          {/* Form Card */}
          <Card className="card-luxury animate-fade-up" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-8 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Age Range */}
                <div className="space-y-3">
                  <Label htmlFor="age" className="text-sm font-medium text-foreground/80 uppercase tracking-wide">
                    Child&apos;s Age
                  </Label>
                  <Select value={ageRange} onValueChange={(v) => setAgeRange(v as AgeRange)}>
                    <SelectTrigger id="age" className="h-14 text-base border-border/60 bg-background/50 hover:bg-background transition-colors">
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-3" className="py-3">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">0–3 years</span>
                          <span className="text-xs text-muted-foreground">Early Intervention eligible</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="3-5" className="py-3">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">3–5 years</span>
                          <span className="text-xs text-muted-foreground">Preschool age</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="6+" className="py-3">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">6+ years</span>
                          <span className="text-xs text-muted-foreground">School age</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {ageConfig && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-scale-in">
                      <p className="text-sm text-foreground/80">
                        <span className="font-medium text-primary">Tip:</span> {ageConfig.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Location Section */}
                <div className="space-y-6">
                  <div className="divider-subtle" />
                  <p className="text-sm text-muted-foreground">
                    Your location helps us find local resources and services.
                  </p>

                  {/* State */}
                  <div className="space-y-3">
                    <Label htmlFor="state" className="text-sm font-medium text-foreground/80 uppercase tracking-wide">
                      State
                    </Label>
                    <Select value={state} onValueChange={(v) => { setState(v); setCounty(''); setZipCode(''); }}>
                      <SelectTrigger id="state" className="h-14 text-base border-border/60 bg-background/50 hover:bg-background transition-colors">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        {usStates.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* County */}
                  <div className="space-y-3">
                    <Label htmlFor="county" className="text-sm font-medium text-foreground/80 uppercase tracking-wide">
                      County
                    </Label>
                    <Select value={county} onValueChange={(v) => { setCounty(v); setZipCode(''); }} disabled={!state}>
                      <SelectTrigger id="county" className="h-14 text-base border-border/60 bg-background/50 hover:bg-background transition-colors disabled:opacity-40">
                        <SelectValue placeholder={state ? "Select your county" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        {counties.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ZIP Code - Optimized with lazy loading */}
                  <div className="space-y-3">
                    <Label htmlFor="zip" className="text-sm font-medium text-foreground/80 uppercase tracking-wide">
                      ZIP Code
                    </Label>
                    <div className="relative">
                      <input
                        type="text"
                        id="zip"
                        className="flex h-14 w-full rounded-xl border border-border/60 bg-background/50 px-4 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 transition-colors hover:bg-background"
                        placeholder={county ? "Enter your ZIP code" : "Select county first"}
                        value={zipCode}
                        onChange={(e) => handleZipCodeChange(e.target.value)}
                        onFocus={handleZipCodeFocus}
                        maxLength={5}
                        disabled={!county}
                      />
                      {isLoadingZip && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {zipError && (
                      <Alert variant="destructive" className="animate-scale-in">
                        <AlertDescription className="text-sm">{zipError}</AlertDescription>
                      </Alert>
                    )}
                    {!zipcodesLib && county && zipCode.length < 5 && (
                      <p className="text-xs text-muted-foreground">
                        ZIP validation will load when you start typing...
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-14 text-base font-medium gap-3 btn-luxury rounded-xl"
                  disabled={!isValid || isLoadingZip}
                >
                  {isLoadingZip ? (
                    <>
                      <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Start My Roadmap
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your information is stored locally and never shared.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
