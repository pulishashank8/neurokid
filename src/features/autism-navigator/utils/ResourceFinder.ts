export const ResourceFinder = {
    getPediatricianLink: (zip: string) =>
        `https://www.google.com/search?q=pediatrician+near+${zip}`,

    getSpecialistLink: (zip: string) =>
        `https://www.autismspeaks.org/resource-guide?zip=${zip}`,

    getMedicaidLink: (state: string) => {
        const links: Record<string, string> = {
            'California': 'https://www.dhcs.ca.gov/services/medi-cal',
            'Texas': 'https://www.hhs.texas.gov/services/health/medicaid-chip',
            'New York': 'https://www.health.ny.gov/health_care/medicaid/',
            'Florida': 'https://ahca.myflorida.com/medicaid/'
        };
        return links[state] || 'https://www.medicaid.gov/medicaid/by-state/index.html';
    },

    getSSALink: (zip: string) =>
        `https://secure.ssa.gov/ICON/main.jsp?q=search&zip=${zip}`,

    getEarlyInterventionLink: (state: string) => {
        const links: Record<string, string> = {
            'California': 'https://www.dds.ca.gov/services/early-start/',
            'Texas': 'https://www.hhs.texas.gov/services/disability/early-childhood-intervention-services',
            'Florida': 'https://www.floridaearlysteps.com/'
        };
        return links[state] || 'https://www.cdc.gov/ncbddd/actearly/parents/states.html';
    }
};
