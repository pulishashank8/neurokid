export interface NPIProvider {
    number: number;
    basic: {
        first_name: string;
        last_name: string;
        organization_name?: string;
        gender: string;
        sole_proprietor: string;
        enumeration_date: string;
        last_updated: string;
        status: string;
    };
    addresses: Array<{
        address_1: string;
        address_2?: string;
        city: string;
        state: string;
        postal_code: string;
        telephone_number?: string;
        fax_number?: string;
        address_purpose: string;
        address_type: string;
    }>;
    taxonomies: Array<{
        code: string;
        desc: string;
        primary: boolean;
        state?: string;
        license?: string;
    }>;
}

export interface NPISearchResponse {
    result_count: number;
    results: NPIProvider[];
}

export const PROVIDER_TYPES = {
    DEVELOPMENTAL_PEDIATRICIAN: {
        name: 'Developmental Pediatrician',
        code: '2080P0202X',
        description: 'Expert in developmental and behavioral pediatrics.'
    },
    CHILD_PSYCHOLOGIST: {
        name: 'Child Psychologist',
        code: '103TC2200X',
        description: 'Specialist in child and adolescent clinical psychology.'
    },
    CHILD_PSYCHIATRIST: {
        name: 'Child Psychiatrist',
        code: '2084P0804X',
        description: 'Specialist in child and adolescent psychiatry.'
    },
    PEDIATRIC_NEUROLOGIST: {
        name: 'Pediatric Neurologist',
        code: '2084N0402X',
        description: 'Expert in children\'s brain and nervous system disorders.'
    },
    SPEECH_THERAPIST: {
        name: 'Speech Therapist',
        code: '235Z00000X',
        description: 'Specialist in speech and language development.'
    },
    ABA_THERAPIST: {
        name: 'ABA Therapist',
        code: '103K00000X',
        description: 'Applied Behavior Analysis specialist.'
    },
    OCCUPATIONAL_THERAPIST: {
        name: 'Occupational Therapist',
        code: '225X00000X',
        description: 'Specialist in sensory and motor skill development.'
    },
    DIAGNOSTIC_PATHOLOGY: {
        name: 'Diagnostic Specialist',
        code: '103G00000X',
        description: 'Clinical neuro-diagnostic specialist.'
    }
};

export class NPIService {
    private static BASE_URL = '/api/autism/npi';

    static async searchProviders(zipCode: string, typeCode?: string): Promise<NPIProvider[]> {
        try {
            const params = new URLSearchParams({
                version: '2.1',
                postal_code: zipCode,
                limit: '20',
            });

            if (typeCode) {
                params.append('taxonomy_code', typeCode);
            } else {
                // Search for any of our relevant taxonomies if none specified
                // Note: API doesn't support multiple taxonomy_code in one call easily as OR
                // So we default to something general or just use the first match
                params.append('taxonomy_code', PROVIDER_TYPES.DEVELOPMENTAL_PEDIATRICIAN.code);
            }

            const response = await fetch(`${this.BASE_URL}?${params.toString()}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('NPI Fetch Error:', errorText);
                throw new Error('Failed to fetch from NPI Registry');
            }

            const data: NPISearchResponse = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('NPPES API Error:', error);
            return [];
        }
    }

    static formatAddress(provider: NPIProvider) {
        const addr = provider.addresses.find(a => a.address_purpose === 'LOCATION') || provider.addresses[0];
        if (!addr) return 'Address not available';
        return `${addr.address_1}${addr.address_2 ? `, ${addr.address_2}` : ''}, ${addr.city}, ${addr.state} ${addr.postal_code.substring(0, 5)}`;
    }

    static getPhone(provider: NPIProvider) {
        const addr = provider.addresses.find(a => a.address_purpose === 'LOCATION') || provider.addresses[0];
        return addr?.telephone_number || null;
    }
}
