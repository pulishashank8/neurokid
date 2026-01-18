/**
 * Facility Search - Central exports
 * Import everything you need from this one file
 * 
 * Example:
 *   import { useFacilities, type Facility } from "@/lib/facilities";
 */

// Types
export type {
  Facility,
  FacilitySearchResponse,
  FacilitySearchParams,
  Coordinates,
  GooglePlaceResult,
  GoogleAddressComponent,
} from "./types/facility";

// Hooks
export { useFacilities } from "./hooks/useFacilities";

// Server Actions
export { searchFacilitiesAction } from "./actions/facilities";

// Services (for server-side use)
export { FacilityService } from "./services/facilityService";
export { LocationServiceClient } from "./clients/locationServiceClient";
