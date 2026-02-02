import type { AgeRange } from '@/features/autism-navigator/types/roadmap';

export interface AgeStepConfig {
  ageRange: AgeRange;
  visibleSteps: number[];
  prioritySteps: number[];
  urgentStep: number;
  message: string;
  explanation: string;
}

export const ageStepConfigs: AgeStepConfig[] = [
  {
    ageRange: '0-3',
    visibleSteps: [1, 2, 3, 4, 5],
    prioritySteps: [1, 2, 4],
    urgentStep: 1,
    message: "Start with screening and a professional care path. Early Intervention (0-3) is critical and often available before a full diagnosis.",
    explanation: `
      • Initial Screening (Step 1) is your immediate first step.
      • Medical Care Path (Step 2) for clinical referral.
      • Therapy & Support (Step 4) includes FREE state services for under 3s.
    `
  },
  {
    ageRange: '3-5',
    visibleSteps: [1, 2, 3, 4, 5],
    prioritySteps: [1, 2],
    urgentStep: 1,
    message: "Transition to school-age services begins now. A medical diagnosis is essential for opening doors to school district support.",
    explanation: `
      • Initial Screening (Step 1) confirms the need for clinical paths.
      • Medical Care Path (Step 2) is key for insurance and school IEP.
      • Therapy & School Support (Step 4) handles IEP and private ABA.
    `
  },
  {
    ageRange: '6+',
    visibleSteps: [1, 2, 3, 4, 5],
    prioritySteps: [2, 3],
    urgentStep: 2,
    message: "Focus on formal diagnosis and clinical support. Secure insurance coverage to start specialized private therapy.",
    explanation: `
      • Medical Care Path (Step 2) unlocks school protections and insurance.
      • Insurance Navigation (Step 3) helps with lifelong therapy costs.
      • Community Hub (Step 5) for connecting with other school-age families.
    `
  }
];

export function getAgeStepConfig(ageRange: AgeRange): AgeStepConfig | undefined {
  return ageStepConfigs.find(config => config.ageRange === ageRange);
}

export function getOrderedStepsForAge(ageRange: AgeRange): number[] {
  const config = getAgeStepConfig(ageRange);
  return config?.visibleSteps ?? [1, 2, 3, 4, 5, 6];
}

export function isStepRecommendedForAge(stepId: number, ageRange: AgeRange): 'urgent' | 'priority' | 'optional' {
  const config = getAgeStepConfig(ageRange);
  if (!config) return 'optional';
  if (config.urgentStep === stepId) return 'urgent';
  if (config.prioritySteps.includes(stepId)) return 'priority';
  return 'optional';
}
