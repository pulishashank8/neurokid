// Contact information for Medicaid, Government services, and Community resources
// Organized by state with county-level specifics where available

export interface MedicaidContact {
  state: string;
  programName: string;
  mainPhone: string;
  website: string;
  localOffice: {
    name: string;
    address: string;
    phone: string;
    hours: string;
  };
  keyContacts: {
    role: string;
    department: string;
    responsibility: string;
  }[];
  applicationProcess: {
    step: number;
    action: string;
    where: string;
    documents: string[];
  }[];
  autismWaiver: {
    name: string;
    description: string;
    waitlistInfo: string;
    contact: string;
  } | null;
}

export interface CommunityContact {
  state: string;
  county: string;
  ccb: {
    name: string;
    fullName: string;
    address: string;
    phone: string;
    intakeLine: string;
    website: string;
    hours: string;
  };
  keyContacts: {
    role: string;
    title: string;
    department: string;
    responsibility: string;
    phone: string;
  }[];
  earlyIntervention: {
    programName: string;
    phone: string;
    website: string;
    referralLine: string;
  };
  childFind: {
    phone: string;
    fax: string;
    district: string;
    website: string;
  };
  parentResources: {
    name: string;
    phone: string;
    services: string[];
  }[];
}

// Colorado Medicaid Information
export const coloradoMedicaid: MedicaidContact = {
  state: 'Colorado',
  programName: 'Health First Colorado',
  mainPhone: '1-800-221-3943',
  website: 'https://www.healthfirstcolorado.com',
  localOffice: {
    name: 'Denver Human Services',
    address: '1200 Federal Blvd, Denver, CO 80204',
    phone: '(720) 944-3666',
    hours: 'Mon-Fri 8:00 AM - 4:30 PM'
  },
  keyContacts: [
    {
      role: 'Eligibility Technician',
      department: 'Department of Human Services',
      responsibility: 'Reviews your application and determines if you qualify for Medicaid'
    },
    {
      role: 'Benefits Coordinator',
      department: 'Health First Colorado Member Services',
      responsibility: 'Helps you understand your benefits and find approved providers'
    },
    {
      role: 'Disability Determination Specialist',
      department: 'State Disability Determination Services',
      responsibility: 'Reviews medical records to determine disability status for Medicaid'
    }
  ],
  applicationProcess: [
    {
      step: 1,
      action: 'Complete the application online or in person',
      where: 'PEAK (colorado.gov/PEAK) or Denver Human Services office',
      documents: ['ID for parent/guardian', 'Child\'s birth certificate', 'Proof of Colorado residency', 'Income verification (pay stubs, tax returns)']
    },
    {
      step: 2,
      action: 'Submit disability documentation',
      where: 'Mail to State Disability Determination Services or upload to PEAK',
      documents: ['Autism diagnosis report', 'Medical records', 'Therapy evaluation reports', 'School IEP (if available)']
    },
    {
      step: 3,
      action: 'Complete interview if requested',
      where: 'Phone interview or in-person at Denver Human Services',
      documents: ['All previous documents for reference']
    },
    {
      step: 4,
      action: 'Receive determination letter (typically 45 days)',
      where: 'Mailed to your home address',
      documents: []
    },
    {
      step: 5,
      action: 'Enroll in a managed care plan and select providers',
      where: 'Online at Health First Colorado or call Member Services',
      documents: ['Medicaid ID card (once received)']
    }
  ],
  autismWaiver: {
    name: 'Children\'s Extensive Support (CES) Waiver',
    description: 'Provides home and community-based services for children with developmental disabilities including autism',
    waitlistInfo: 'Waitlist varies by region. Contact your local CCB for current wait times.',
    contact: 'Contact Rocky Mountain Human Services for Denver County: (303) 636-5600'
  }
};

// Denver County Community Contacts
export const denverCommunityContacts: CommunityContact = {
  state: 'Colorado',
  county: 'Denver',
  ccb: {
    name: 'Rocky Mountain Human Services (RMHS)',
    fullName: 'Rocky Mountain Human Services - Community Centered Board',
    address: '9900 E Iliff Ave, Denver, CO 80231',
    phone: '(303) 636-5600',
    intakeLine: '(303) 636-5600 ext. 1',
    website: 'https://www.rmhumanservices.org',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM'
  },
  keyContacts: [
    {
      role: 'Intake Case Manager',
      title: 'Developmental Disabilities Intake Specialist',
      department: 'Rocky Mountain Human Services',
      responsibility: 'First point of contact. Explains eligibility, sends application packet, schedules intake appointment.',
      phone: '(303) 636-5600'
    },
    {
      role: 'Service Coordinator',
      title: 'Case Manager',
      department: 'Case Management Agency (CMA)',
      responsibility: 'Assigned after eligibility. Helps create service plan, connects you to providers, monitors progress.',
      phone: '(303) 636-5600'
    },
    {
      role: 'Family Navigator',
      title: 'Family Support Specialist',
      department: 'RMHS Family Services',
      responsibility: 'Provides emotional support, helps navigate the system, connects families with resources and support groups.',
      phone: '(303) 636-5600'
    },
    {
      role: 'Respite Coordinator',
      title: 'Respite Services Coordinator',
      department: 'RMHS Support Services',
      responsibility: 'Helps arrange respite care so caregivers can take breaks.',
      phone: '(303) 636-5600'
    }
  ],
  earlyIntervention: {
    programName: 'Early Intervention Colorado',
    phone: '1-833-733-3734',
    website: 'https://www.eicolorado.org',
    referralLine: '1-833-733-3734 (statewide referral line)'
  },
  childFind: {
    phone: '(720) 423-1410',
    fax: '(720) 423-1525',
    district: 'Denver Public Schools',
    website: 'https://ess.dpsk12.org/page/child-find'
  },
  parentResources: [
    {
      name: 'The Arc of Colorado',
      phone: '(303) 864-9334',
      services: ['Parent advocacy training', 'IEP support', 'Rights information', 'Support groups']
    },
    {
      name: 'Autism Society of Colorado',
      phone: '(720) 214-0794',
      services: ['Family support', 'Resource navigation', 'Community events', 'Advocacy']
    },
    {
      name: 'Family Voices Colorado',
      phone: '(303) 377-1112',
      services: ['Healthcare navigation', 'Parent-to-parent support', 'Insurance help']
    }
  ]
};

// Get contacts by state and county
export function getMedicaidContact(state: string): MedicaidContact | null {
  if (state === 'Colorado') return coloradoMedicaid;
  // Add more states as needed
  return null;
}

export function getCommunityContact(state: string, county: string): CommunityContact | null {
  if (state === 'Colorado' && county === 'Denver') return denverCommunityContacts;
  // Add more counties as needed
  return null;
}

// Generic fallback for states/counties without specific data
export function getGenericMedicaidGuidance(state: string): string {
  return `
Contact your state's Medicaid office to apply. Key steps:
1. Find your local Department of Human Services or Social Services office
2. Ask for an "Eligibility Technician" to help with your application
3. Request information about disability waivers for children with autism
4. Call 211 for local resource referrals
  `.trim();
}

export function getGenericCommunityGuidance(state: string, county: string): string {
  return `
To find developmental disability services in ${county} County, ${state}:
1. Call 211 and ask for "developmental disabilities services"
2. Contact your state's Department of Developmental Disabilities
3. Search for "Community Centered Board" or "Developmental Disabilities Board" in your area
4. Contact your child's pediatrician for local referrals
  `.trim();
}
