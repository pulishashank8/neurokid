declare module 'zipcodes' {
  export type ZipLookupResult = {
    zip: string;
    city: string;
    state: string; // 2-letter code
    latitude: number;
    longitude: number;
  };

  export function lookup(zip: string): ZipLookupResult | null;
}
