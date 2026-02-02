export type AgeRange = '0-3' | '3-5' | '6+';

export type StepStatus = 'not_started' | 'in_progress' | 'completed';

export interface LocationData {
  ageRange: AgeRange;
  country: string;
  state: string;
  county: string;
  zipCode: string;
}

export interface StepProgress {
  stepId: number;
  status: StepStatus;
}

export interface RoadmapStep {
  id: number;
  title: string;
  icon: string;
  description: string;
  documents: string[];
  timeline: string;
  whatItDoesNot: string;
  emotionalSupport?: string;
  doctorInstructions?: {
    types: string[];
    questions: string[];
  };
}

export interface Provider {
  id: string;
  name: string;
  specialty: 'Speech Therapy' | 'ABA Therapy' | 'Occupational Therapy' | 'Developmental Pediatrician' | 'Child Psychologist' | 'Pediatric Neurologist';
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  distance: string;
}

export interface SchoolContact {
  role: string;
  title: string;
  officeType: string;
  location: string;
  phone: string;
}

export interface StateGuidance {
  state: string;
  medicaidWebsite: string;
  applicationProcess: string[];
  waitTime: string;
  officeType: string;
  notes: string;
}

export interface SmartStartPriority {
  ageRange: AgeRange;
  prioritySteps: number[];
  message: string;
  urgentStep: number;
}
