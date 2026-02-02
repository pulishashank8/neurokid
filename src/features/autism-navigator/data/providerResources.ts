import type { Provider } from '@/features/autism-navigator/types/roadmap';

// State-specific autism resource directories and provider search tools
export interface StateProviderResource {
  state: string;
  earlyInterventionUrl: string;
  autismResourceUrl: string;
  providerSearchUrl: string;
  specialEducationUrl: string;
  notes?: string;
}

export const STATE_PROVIDER_RESOURCES: Record<string, StateProviderResource> = {
  PA: {
    state: 'Pennsylvania',
    earlyInterventionUrl: 'https://www.dhs.pa.gov/Services/Children/Pages/Early-Intervention.aspx',
    autismResourceUrl: 'https://www.paautism.org/resources',
    providerSearchUrl: 'https://www.humanservices.state.pa.us/BHDAP/Search',
    specialEducationUrl: 'https://www.pattan.net/',
    notes: 'PA has county-based EI programs. Contact your county MH/ID office.'
  },
  CA: {
    state: 'California',
    earlyInterventionUrl: 'https://www.dds.ca.gov/services/early-start/',
    autismResourceUrl: 'https://www.autism-society.org/in-your-area/california/',
    providerSearchUrl: 'https://www.dhcs.ca.gov/services/medi-cal/Pages/default.aspx',
    specialEducationUrl: 'https://www.cde.ca.gov/sp/se/',
  },
  TX: {
    state: 'Texas',
    earlyInterventionUrl: 'https://www.hhs.texas.gov/services/disability/early-childhood-intervention-services',
    autismResourceUrl: 'https://www.texasautismsociety.org/',
    providerSearchUrl: 'https://www.hhs.texas.gov/services/health/medicaid-chip',
    specialEducationUrl: 'https://tea.texas.gov/academics/special-student-populations/special-education',
  },
  NY: {
    state: 'New York',
    earlyInterventionUrl: 'https://www.health.ny.gov/community/infants_children/early_intervention/',
    autismResourceUrl: 'https://opwdd.ny.gov/',
    providerSearchUrl: 'https://www.health.ny.gov/health_care/medicaid/',
    specialEducationUrl: 'https://www.nysed.gov/special-education',
  },
  FL: {
    state: 'Florida',
    earlyInterventionUrl: 'https://www.floridahealth.gov/programs-and-services/childrens-health/early-steps/',
    autismResourceUrl: 'https://www.centerforautism.com/',
    providerSearchUrl: 'https://www.flmedicaidmanagedcare.com/',
    specialEducationUrl: 'https://www.fldoe.org/academics/exceptional-student-edu/',
  },
  // Default for states without specific data
  DEFAULT: {
    state: 'Your State',
    earlyInterventionUrl: 'https://www.cdc.gov/ncbddd/actearly/parents/states.html',
    autismResourceUrl: 'https://www.autismspeaks.org/resource-guide',
    providerSearchUrl: 'https://npiregistry.cms.hhs.gov/search',
    specialEducationUrl: 'https://sites.ed.gov/idea/',
  }
};

export function getStateResources(stateCode: string): StateProviderResource {
  return STATE_PROVIDER_RESOURCES[stateCode] || STATE_PROVIDER_RESOURCES.DEFAULT;
}

// National autism provider directories that work across all states
export const NATIONAL_RESOURCES = [
  {
    name: 'Autism Speaks Resource Guide',
    url: 'https://www.autismspeaks.org/resource-guide',
    description: 'Search for autism providers, services, and support by ZIP code',
  },
  {
    name: 'Psychology Today - Autism Specialists',
    url: 'https://www.psychologytoday.com/us/therapists/autism',
    description: 'Find therapists and psychologists specializing in autism',
  },
  {
    name: 'NPI Registry',
    url: 'https://npiregistry.cms.hhs.gov/search',
    description: 'Official healthcare provider database from CMS',
  },
  {
    name: 'ASHA ProFind',
    url: 'https://find.asha.org/',
    description: 'Find certified speech-language pathologists',
  },
  {
    name: 'BACB Certificant Registry',
    url: 'https://www.bacb.com/find-a-certificant/',
    description: 'Find certified behavior analysts (ABA therapy)',
  },
  {
    name: 'AOTA Find an OT',
    url: 'https://www.aota.org/practice/practice-essentials/find-an-ot',
    description: 'Find occupational therapists',
  },
];

// Specialty-specific search URLs
export function getSpecialtySearchUrl(specialty: Provider['specialty'], zipCode: string, state: string): string {
  const baseNPI = `https://npiregistry.cms.hhs.gov/search?postal_code=${zipCode}&state=${state}`;
  
  const specialtyUrls: Record<Provider['specialty'], string> = {
    'Speech Therapy': `https://find.asha.org/results?city=&state=${state}&zip=${zipCode}&radius=25`,
    'ABA Therapy': 'https://www.bacb.com/find-a-certificant/',
    'Occupational Therapy': baseNPI,
    'Developmental Pediatrician': baseNPI,
    'Child Psychologist': `https://www.psychologytoday.com/us/therapists/autism/${state.toLowerCase()}?zip=${zipCode}`,
    'Pediatric Neurologist': baseNPI,
  };
  
  return specialtyUrls[specialty] || baseNPI;
}
