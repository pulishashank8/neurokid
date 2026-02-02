export interface StateResource {
    name: string;
    medicaidName: string;
    medicaidUrl: string;
    earlyInterventionName: string;
    earlyInterventionUrl: string;
    earlyInterventionWaitTime: string;
    medicaidWaitTime: string;
    contactNotes: string;
    applicationProcess?: string[];
}

export const stateResources: Record<string, StateResource> = {
    'Alabama': {
        name: 'Alabama',
        medicaidName: 'Alabama Medicaid',
        medicaidUrl: 'https://medicaid.alabama.gov/',
        earlyInterventionName: 'Alabama Early Intervention System (AEIS)',
        earlyInterventionUrl: 'https://www.rehab.alabama.gov/services/ei',
        earlyInterventionWaitTime: '45-60 days',
        medicaidWaitTime: '45 days',
        contactNotes: 'Contact the District 211 service for immediate assistance.'
    },
    'California': {
        name: 'California',
        medicaidName: 'Medi-Cal',
        medicaidUrl: 'https://www.dhcs.ca.gov/services/medi-cal',
        earlyInterventionName: 'Regional Center Systems / Early Start',
        earlyInterventionUrl: 'https://www.dds.ca.gov/services/early-start/',
        earlyInterventionWaitTime: '45 days for evaluation',
        medicaidWaitTime: '45 days',
        contactNotes: 'California uses Regional Centers as the primary point of entry for developmental services.'
    },
    'Texas': {
        name: 'Texas',
        medicaidName: 'Texas Medicaid (STAR Kids)',
        medicaidUrl: 'https://www.hhs.texas.gov/services/health/medicaid-chip',
        earlyInterventionName: 'Early Childhood Intervention (ECI)',
        earlyInterventionUrl: 'https://www.hhs.texas.gov/services/disability/early-childhood-intervention-services',
        earlyInterventionWaitTime: '45 days',
        medicaidWaitTime: '30-45 days',
        contactNotes: 'Texas ECI is specifically for children 0-3. Over 3, transition to school district services.'
    },
    'New York': {
        name: 'New York',
        medicaidName: 'NY Medicaid',
        medicaidUrl: 'https://www.health.ny.gov/health_care/medicaid/',
        earlyInterventionName: 'Bureau of Early Intervention',
        earlyInterventionUrl: 'https://www.health.ny.gov/community/infants_children/early_intervention/',
        earlyInterventionWaitTime: '30-45 days',
        medicaidWaitTime: '45 days',
        contactNotes: 'Managed through county health departments.'
    },
    'Florida': {
        name: 'Florida',
        medicaidName: 'Florida Medicaid',
        medicaidUrl: 'https://ahca.myflorida.com/medicaid/',
        earlyInterventionName: 'Early Steps',
        earlyInterventionUrl: 'https://www.floridaearlysteps.com/',
        earlyInterventionWaitTime: '45 days',
        medicaidWaitTime: '45-90 days',
        contactNotes: 'Early Steps is Floridas early intervention system for children 0-3.'
    }
    // This can be expanded to all 50 states.
};

export function getStateResource(stateName: string): StateResource | undefined {
    return stateResources[stateName];
}
