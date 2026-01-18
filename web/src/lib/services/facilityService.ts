/**
 * Facility Service - Business logic for facility search and data transformation
 * TypeScript port of the Python FacilityService
 */

import type {
  Facility,
  FacilitySearchResponse,
  GooglePlaceResult,
  GoogleAddressComponent,
} from "../types/facility";
import { LocationServiceClient } from "../clients/locationServiceClient";

interface AddressComponents {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export class FacilityService {
  private locationClient: LocationServiceClient;

  constructor(locationClient: LocationServiceClient) {
    this.locationClient = locationClient;
  }

  /**
   * Search for autism service facilities near a zip code
   */
  async searchFacilities(
    zipCode: string,
    radiusMiles: number = 25,
    serviceType?: string | null,
    autismOnly: boolean = true,
    pageToken?: string | null
  ): Promise<FacilitySearchResponse> {
    const rawData = await this.locationClient.searchFacilities(
      zipCode,
      radiusMiles,
      autismOnly,
      pageToken
    );

    const facilities: Facility[] = [];

    for (const place of rawData.results) {
      const addressParts = this.parseAddressComponents(
        place.addressComponents || []
      );

      // Extract display name
      let name = "Unknown Facility";
      if (place.displayName) {
        if (typeof place.displayName === "object" && "text" in place.displayName) {
          name = place.displayName.text;
        } else if (typeof place.displayName === "string") {
          name = place.displayName;
        }
      }

      const formattedAddress = place.formattedAddress || "";
      const address = addressParts.street_address || formattedAddress;

      const latitude = place.location?.latitude;
      const longitude = place.location?.longitude;
      const phone = place.nationalPhoneNumber;
      const rating = place.rating;
      const distance = place.distance_miles;
      const placeTypes = place.types || [];
      const services = this.mapTypesToServices(placeTypes);
      const website = place.websiteUri;

      const facility: Facility = {
        id: place.id,
        name,
        address,
        city: addressParts.city,
        state: addressParts.state,
        zip_code: addressParts.zip_code || zipCode,
        phone: phone || null,
        services,
        latitude: latitude || null,
        longitude: longitude || null,
        rating: rating || null,
        distance: distance || null,
        website: website || null,
        place_types: placeTypes,
      };

      // Filter by service type if specified
      if (serviceType) {
        const hasService = facility.services.some(
          (s) => s.toLowerCase() === serviceType.toLowerCase()
        );
        if (hasService) {
          facilities.push(facility);
        }
      } else {
        facilities.push(facility);
      }
    }

    return {
      facilities,
      total: facilities.length,
      zip_code: zipCode,
      nextPageToken: rawData.nextPageToken,
    };
  }

  /**
   * Parse Google Places address components into structured data
   */
  private parseAddressComponents(
    components: GoogleAddressComponent[]
  ): AddressComponents {
    const result: AddressComponents = {
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "",
    };

    const streetParts: string[] = [];

    for (const component of components) {
      const types = component.types || [];
      const longName = component.longText || "";
      const shortName = component.shortText || "";

      if (types.includes("street_number")) {
        streetParts.unshift(longName); // Add at beginning
      } else if (types.includes("route")) {
        streetParts.push(longName);
      } else if (types.includes("locality")) {
        result.city = longName;
      } else if (types.includes("administrative_area_level_1")) {
        result.state = shortName;
      } else if (types.includes("postal_code")) {
        result.zip_code = longName;
      } else if (types.includes("country")) {
        result.country = shortName;
      }
    }

    if (streetParts.length > 0) {
      result.street_address = streetParts.join(" ");
    }

    return result;
  }

  /**
   * Map Google Place types to service categories
   */
  private mapTypesToServices(placeTypes: string[]): string[] {
    const typeMapping: Record<string, string> = {
      hospital: "Medical Services",
      doctor: "Primary Care",
      health: "Healthcare Services",
      physiotherapist: "Physical Therapy",
      rehabilitation_center: "Rehabilitation Services",
      medical_lab: "Laboratory Services",
      psychologist: "Mental Health Services",
      mental_health: "Mental Health Services",
    };

    const services: string[] = [];

    for (const placeType of placeTypes) {
      if (placeType in typeMapping) {
        const service = typeMapping[placeType];
        if (!services.includes(service)) {
          services.push(service);
        }
      }
    }

    // Default service if none matched
    if (services.length === 0) {
      services.push("Healthcare Services");
    }

    return services;
  }
}
