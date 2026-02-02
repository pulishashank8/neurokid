import type { RoadmapStep, Provider, SchoolContact, StateGuidance, SmartStartPriority } from '@/features/autism-navigator/types/roadmap';

export const roadmapSteps: RoadmapStep[] = [
  {
    id: 1,
    title: 'Initial Screening (M-CHAT-R/F)',
    description: 'A quick, simple tool to check for early signs of autism. This is the official starting point for most families.',
    icon: '📋',
    documents: [],
    timeline: '',
    whatItDoesNot: 'This is a screening tool, not a diagnostic verdict. High scores simply mean a specialist should take a closer look.',
    emotionalSupport: "You're taking the first brave step. This tool helps advocate for the support your child deserves."
  },
  {
    id: 2,
    title: 'Medical Diagnosis & Care Path',
    description: 'Connecting with a developmental pediatrician or specialist to receive a formal diagnosis. This unlocks insurance for all future therapies.',
    icon: '🩺',
    documents: [],
    timeline: '',
    whatItDoesNot: 'A pediatric visit is for the referral; the formal diagnosis usually happens with a sub-specialist like a psychologist or neurologist.',
    emotionalSupport: "Waiting for appointments can be hard. Remember, your child is the same wonderful person they were before the evaluation.",
    doctorInstructions: {
      types: [
        "Developmental-Behavioral Pediatrician (Top Priority)",
        "Child Psychologist (Clinical Diagnosis focus)",
        "Pediatric Neurologist (Brain/Nervous system check)",
        "Child & Adolescent Psychiatrist (Medical path)"
      ],
      questions: [
        "Do you provide a formal diagnostic report for insurance (ABA) and schools (IEP)?",
        "What is your typical wait time for a full evaluation?",
        "Can you provide a list of local therapists or Early Intervention contacts?",
        "Do you accept my specific health insurance plan?"
      ]
    }
  },
  {
    id: 3,
    title: 'Insurance & Medicaid Navigation',
    description: 'Securing coverage through private insurance or state Medicaid. This ensures your child gets high-quality therapy without financial burden.',
    icon: '💳',
    documents: [],
    timeline: '',
    whatItDoesNot: 'Insurance approval is a separate process from finding a provider. Both must align to start services.',
  },
  {
    id: 4,
    title: 'Therapy Access & School Support',
    description: 'Finding ABA providers, Speech/OT clinics, and contacting your school district for an Individualized Education Program (IEP).',
    icon: '🎯',
    documents: [],
    timeline: '',
    whatItDoesNot: 'School support (IEP) is based on educational need, while private therapy is based on medical necessity. You often need both.',
  },
  {
    id: 5,
    title: 'NeuroKid Community Hub',
    description: 'Join a premium network of parents who understand your journey. No documents, no data collection—just genuine connection and shared wisdom.',
    icon: '🤝',
    documents: [],
    timeline: '',
    whatItDoesNot: 'We are a support network, not a government agency. Your privacy is our absolute priority.',
  }
];

export const navigatorFAQs = [
  { q: "What is an M-CHAT-R/F?", a: "It's a valid screening tool for toddlers between 16 and 30 months old to assess risk for autism." },
  { q: "Do I need a doctor's referral for the screening?", a: "No, you can take the screening yourself right here or at home before seeing a doctor." },
  { q: "Why is a clinical diagnosis necessary?", a: "It is required by almost all insurance companies to cover the costs of ABA, Speech, and Occupational Therapy." },
  { q: "How long is the typical wait for a specialist?", a: "Wait times vary by state but typically range from 2 to 8 months. We recommend getting on multiple waitlists." },
  { q: "What's the difference between Medicaid and Private Insurance?", a: "Medicaid is state-funded and often covers more 'social' supports, while private insurance focuses on medical therapy." },
  { q: "What is ABA therapy?", a: "Applied Behavior Analysis is a therapy based on the science of learning and behavior to improve specific skills." },
  { q: "Does the school district provide free therapy?", a: "School districts provide services through an IEP if the autism affects the child's ability to learn in a classroom." },
  { q: "What is an IEP?", a: "An Individualized Education Program—a legal document that outlines the special education services a child will receive." },
  { q: "Can my child go to a normal school?", a: "Yes, many children with autism are 'mainstreamed' with appropriate supports and accommodations." },
  { q: "Does NeuroKid collect my child's medical records?", a: "No. We never collect or store your official documents or private medical data." },
  { q: "What should I ask my pediatrician?", a: "Ask for a 'Referral for a Developmental Evaluation' and a 'Speech/OT Evaluation' immediately." },
  { q: "Is autism curable?", a: "Autism is a neurodevelopmental difference, not a disease. Therapy focuses on building skills and independence." },
  { q: "Who provides the formal diagnosis?", a: "Usually a Developmental Pediatrician, Child Psychologist, or Pediatric Neurologist." },
  { q: "How do I find ABA providers near me?", a: "Use the 'Find Therapy' button in Step 4 to see providers verified in your ZIP code." },
  { q: "What if my child is older than 3?", a: "You should contact your local school district's 'Child Find' office immediately for an evaluation." },
  { q: "What is a 'Child Find' evaluation?", a: "A free evaluation provided by public schools to identify children who may need special education." },
  { q: "Can I use both Medicaid and Private Insurance?", a: "Yes, this is called 'Secondary Insurance' and can help cover co-pays and additional services." },
  { q: "How much does therapy cost out of pocket?", a: "Without insurance, costs can be very high ($100-$200/hr). Getting insurance approval is critical." },
  { q: "Is the screening 100% accurate?", a: "No tool is 100%. It is a 'flag' system to see if more professional testing is needed." },
  { q: "What is 'Early Intervention'?", a: "Services for children 0-3 that help with developmental delays. It is often state-funded and free." },
  { q: "Do I need a diagnosis for Early Intervention?", a: "In many states, you do NOT need a formal diagnosis to start 0-3 services; a developmental delay is enough." },
  { q: "What happens in a diagnostic evaluation?", a: "Testing involves observation, parent interviews, and standardized play-based assessments." },
  { q: "How do I join the NeuroKid community?", a: "Simply click 'Join Community' in Step 5. No paperwork required." },
  { q: "Are there local support groups?", a: "Yes, we help you find local chapters of the Autism Society and other parent networks." },
  { q: "What is 'Respite Care'?", a: "Temporary care for your child that gives parents/caregivers a necessary break." },
  { q: "How do I handle the emotional stress?", a: "Connect with other parents in Step 5. You are not alone on this journey." },
  { q: "What is a 504 Plan?", a: "Similar to an IEP, but for children who need accommodations (like extra time) but not specialized instruction." },
  { q: "Can I appeal an insurance denial?", a: "Yes! You have a legal right to appeal denials for medically necessary autism treatment." },
  { q: "How often should my child have therapy?", a: "This depends on the child's needs, ranging from a few hours a week to 30+ hours for intensive ABA." },
  { q: "What makes NeuroKid different?", a: "We provide a premium, direct path with localized contacts, focused on empowering parents without the fluff." }
];

export const smartStartPriorities: SmartStartPriority[] = [
  {
    ageRange: '0-3',
    prioritySteps: [1, 2, 4],
    urgentStep: 1,
    message: 'Early Intervention is your most urgent step. Children under 3 can access free services through your state\'s Early Intervention program—no diagnosis required!'
  },
  {
    ageRange: '3-5',
    prioritySteps: [1, 2],
    urgentStep: 1,
    message: 'Focus on medical diagnosis and starting school evaluation. Preschool services through your school district begin at age 3.'
  },
  {
    ageRange: '6+',
    prioritySteps: [2, 3],
    urgentStep: 2,
    message: 'Medical Care Path and Insurance Navigation are key priorities. Secure your formal diagnosis to unlock school-based support and private therapy.'
  }
];

export const mockProviders: Provider[] = [
  {
    id: '1',
    name: 'Bright Futures Speech Therapy',
    specialty: 'Speech Therapy',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    phone: '(512) 555-0101',
    distance: '2.3 miles'
  },
  {
    id: '2',
    name: 'Children\'s ABA Center',
    specialty: 'ABA Therapy',
    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
    phone: '(512) 555-0202',
    distance: '3.1 miles'
  },
  {
    id: '3',
    name: 'Little Steps Occupational Therapy',
    specialty: 'Occupational Therapy',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    phone: '(512) 555-0303',
    distance: '4.5 miles'
  },
  {
    id: '4',
    name: 'Dr. Sarah Chen - Developmental Pediatrics',
    specialty: 'Developmental Pediatrician',
    city: 'Austin',
    state: 'TX',
    zipCode: '78705',
    phone: '(512) 555-0404',
    distance: '5.2 miles'
  },
  {
    id: '5',
    name: 'Austin Child Psychology Associates',
    specialty: 'Child Psychologist',
    city: 'Austin',
    state: 'TX',
    zipCode: '78703',
    phone: '(512) 555-0505',
    distance: '3.8 miles'
  },
  {
    id: '6',
    name: 'Pediatric Neurology of Central Texas',
    specialty: 'Pediatric Neurologist',
    city: 'Austin',
    state: 'TX',
    zipCode: '78756',
    phone: '(512) 555-0606',
    distance: '6.1 miles'
  }
];

export const getSchoolContacts = (county: string, state: string): SchoolContact[] => [
  {
    role: 'Special Education Coordinator',
    title: 'District Special Education Director',
    officeType: 'School District Central Office',
    location: `${county} County School District, ${state}`,
    phone: '(555) 555-7001'
  },
  {
    role: 'School Psychologist',
    title: 'Licensed Educational Psychologist',
    officeType: 'Student Services Department',
    location: `${county} County Schools, ${state}`,
    phone: '(555) 555-7002'
  },
  {
    role: 'Parent Liaison',
    title: 'Family Engagement Specialist',
    officeType: 'Parent Resource Center',
    location: `${county} County, ${state}`,
    phone: '(555) 555-7003'
  }
];

export const stateGuidance: Record<string, StateGuidance> = {
  'TX': {
    state: 'Texas',
    medicaidWebsite: 'https://www.yourtexasbenefits.com',
    applicationProcess: [
      'Visit YourTexasBenefits.com or call 2-1-1',
      'Complete application online, by mail, or in person',
      'Provide required documents (ID, income, residency proof)',
      'Interview may be required',
      'Receive determination letter within 45 days'
    ],
    waitTime: '30-45 days for Medicaid; autism waiver waitlist varies',
    officeType: 'Texas Health and Human Services Office',
    notes: 'Texas has STAR Kids managed care for children with disabilities'
  },
  'CA': {
    state: 'California',
    medicaidWebsite: 'https://www.coveredca.com',
    applicationProcess: [
      'Apply through Covered California or county office',
      'Complete Medi-Cal application',
      'Submit verification documents',
      'Receive eligibility determination',
      'Enroll in managed care plan'
    ],
    waitTime: '45 days for Medi-Cal processing',
    officeType: 'County Social Services Office',
    notes: 'California has Regional Centers for developmental services'
  },
  'NY': {
    state: 'New York',
    medicaidWebsite: 'https://www.ny.gov/services/apply-medicaid',
    applicationProcess: [
      'Apply online through NY State of Health',
      'Visit local Department of Social Services',
      'Submit application and documents',
      'Complete interview if required',
      'Receive determination within 45 days'
    ],
    waitTime: '45 days for processing',
    officeType: 'Department of Social Services',
    notes: 'NY has Children and Youth with Special Health Care Needs program'
  }
};

export const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

export const getCountiesByState = (state: string): string[] => {
  // Mock counties - in production, this would be a comprehensive database
  const counties: Record<string, string[]> = {
    'Alabama': ['Jefferson', 'Mobile', 'Madison', 'Montgomery', 'Baldwin', 'Tuscaloosa', 'Shelby'],
    'Alaska': ['Anchorage', 'Fairbanks North Star', 'Matanuska-Susitna', 'Kenai Peninsula', 'Juneau'],
    'Arizona': ['Maricopa', 'Pima', 'Pinal', 'Yavapai', 'Yuma', 'Mohave', 'Coconino'],
    'Arkansas': ['Pulaski', 'Benton', 'Washington', 'Sebastian', 'Faulkner', 'Saline', 'Craighead'],
    'California': ['Los Angeles', 'San Diego', 'Orange', 'Riverside', 'San Bernardino', 'Santa Clara', 'Alameda'],
    'Colorado': ['Denver', 'El Paso', 'Arapahoe', 'Jefferson', 'Adams', 'Douglas', 'Larimer'],
    'Connecticut': ['Fairfield', 'Hartford', 'New Haven', 'New London', 'Litchfield', 'Middlesex', 'Tolland'],
    'Delaware': ['New Castle', 'Sussex', 'Kent'],
    'Florida': ['Miami-Dade', 'Broward', 'Palm Beach', 'Hillsborough', 'Orange', 'Pinellas', 'Duval', 'Lee', 'Polk', 'Brevard'],
    'Georgia': ['Fulton', 'Gwinnett', 'Cobb', 'DeKalb', 'Chatham', 'Clayton', 'Cherokee'],
    'Hawaii': ['Honolulu', 'Hawaii', 'Maui', 'Kauai'],
    'Idaho': ['Ada', 'Canyon', 'Kootenai', 'Bonneville', 'Bannock', 'Twin Falls'],
    'Illinois': ['Cook', 'DuPage', 'Lake', 'Will', 'Kane', 'McHenry', 'Winnebago'],
    'Indiana': ['Marion', 'Lake', 'Allen', 'Hamilton', 'St. Joseph', 'Elkhart', 'Tippecanoe'],
    'Iowa': ['Polk', 'Linn', 'Scott', 'Johnson', 'Black Hawk', 'Woodbury', 'Dubuque'],
    'Kansas': ['Johnson', 'Sedgwick', 'Shawnee', 'Wyandotte', 'Douglas', 'Leavenworth'],
    'Kentucky': ['Jefferson', 'Fayette', 'Kenton', 'Boone', 'Warren', 'Hardin', 'Daviess'],
    'Louisiana': ['Orleans', 'Jefferson', 'East Baton Rouge', 'Caddo', 'St. Tammany', 'Lafayette'],
    'Maine': ['Cumberland', 'York', 'Penobscot', 'Kennebec', 'Androscoggin'],
    'Maryland': ['Montgomery', 'Prince George\'s', 'Baltimore', 'Anne Arundel', 'Howard', 'Harford'],
    'Massachusetts': ['Middlesex', 'Worcester', 'Suffolk', 'Essex', 'Norfolk', 'Bristol', 'Plymouth'],
    'Michigan': ['Wayne', 'Oakland', 'Macomb', 'Kent', 'Genesee', 'Washtenaw', 'Ingham'],
    'Minnesota': ['Hennepin', 'Ramsey', 'Dakota', 'Anoka', 'Washington', 'Scott', 'Olmsted'],
    'Mississippi': ['Hinds', 'Harrison', 'DeSoto', 'Rankin', 'Jackson', 'Madison', 'Lee'],
    'Missouri': ['St. Louis', 'Jackson', 'St. Charles', 'Greene', 'Clay', 'Jefferson', 'Boone'],
    'Montana': ['Yellowstone', 'Missoula', 'Gallatin', 'Flathead', 'Cascade', 'Lewis and Clark'],
    'Nebraska': ['Douglas', 'Lancaster', 'Sarpy', 'Hall', 'Buffalo', 'Lincoln'],
    'Nevada': ['Clark', 'Washoe', 'Carson City', 'Douglas', 'Elko', 'Lyon'],
    'New Hampshire': ['Hillsborough', 'Rockingham', 'Merrimack', 'Strafford', 'Grafton'],
    'New Jersey': ['Bergen', 'Middlesex', 'Essex', 'Hudson', 'Monmouth', 'Ocean', 'Union'],
    'New Mexico': ['Bernalillo', 'Doña Ana', 'Santa Fe', 'Sandoval', 'San Juan', 'McKinley'],
    'New York': ['New York', 'Kings', 'Queens', 'Bronx', 'Suffolk', 'Nassau', 'Westchester'],
    'North Carolina': ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Cumberland', 'Durham', 'Buncombe'],
    'North Dakota': ['Cass', 'Burleigh', 'Grand Forks', 'Ward', 'Williams', 'Stark'],
    'Ohio': ['Cuyahoga', 'Franklin', 'Hamilton', 'Summit', 'Montgomery', 'Lucas', 'Butler'],
    'Oklahoma': ['Oklahoma', 'Tulsa', 'Cleveland', 'Canadian', 'Comanche', 'Rogers'],
    'Oregon': ['Multnomah', 'Washington', 'Clackamas', 'Lane', 'Marion', 'Jackson', 'Deschutes'],
    'Pennsylvania': ['Philadelphia', 'Allegheny', 'Montgomery', 'Bucks', 'Delaware', 'Lancaster', 'Chester'],
    'Rhode Island': ['Providence', 'Kent', 'Washington', 'Newport', 'Bristol'],
    'South Carolina': ['Greenville', 'Richland', 'Charleston', 'Horry', 'Spartanburg', 'Lexington'],
    'South Dakota': ['Minnehaha', 'Pennington', 'Lincoln', 'Brown', 'Brookings', 'Codington'],
    'Tennessee': ['Shelby', 'Davidson', 'Knox', 'Hamilton', 'Rutherford', 'Williamson', 'Sumner'],
    'Texas': ['Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis', 'Collin', 'Denton', 'Hidalgo', 'Fort Bend', 'El Paso'],
    'Utah': ['Salt Lake', 'Utah', 'Davis', 'Weber', 'Washington', 'Cache'],
    'Vermont': ['Chittenden', 'Rutland', 'Washington', 'Windsor', 'Windham', 'Franklin'],
    'Virginia': ['Fairfax', 'Prince William', 'Virginia Beach', 'Loudoun', 'Chesterfield', 'Henrico'],
    'Washington': ['King', 'Pierce', 'Snohomish', 'Spokane', 'Clark', 'Thurston', 'Kitsap'],
    'West Virginia': ['Kanawha', 'Berkeley', 'Cabell', 'Monongalia', 'Wood', 'Raleigh'],
    'Wisconsin': ['Milwaukee', 'Dane', 'Waukesha', 'Brown', 'Racine', 'Outagamie', 'Winnebago'],
    'Wyoming': ['Laramie', 'Natrona', 'Campbell', 'Sweetwater', 'Fremont', 'Albany'],
  };
  return counties[state] || ['Other (enter county in notes)'];
};
