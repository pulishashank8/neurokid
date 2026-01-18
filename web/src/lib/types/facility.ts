/**
 * Facility types matching the Python Pydantic models
 */

export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string | null;
  services: string[];
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  distance?: number | null;
  website?: string | null;
  place_types: string[];
}

export interface FacilitySearchResponse {
  facilities: Facility[];
  total: number;
  zip_code: string;
  nextPageToken?: string | null;
}

export interface FacilitySearchParams {
  zip_code: string;
  radius?: number;
  service_type?: string | null;
  autism_only?: boolean;
  pageToken?: string | null;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GooglePlaceResult {
  id: string;
  displayName: { text: string } | string;
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  nationalPhoneNumber?: string;
  types?: string[];
  websiteUri?: string;
  addressComponents?: GoogleAddressComponent[];
  distance_miles?: number;
}

export interface GoogleAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}
