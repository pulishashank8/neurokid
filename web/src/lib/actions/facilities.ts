"use server";

/**
 * Server actions for facility search
 * Called directly from components without REST API
 */

import { LocationServiceClient } from "@/lib/clients/locationServiceClient";
import { FacilityService } from "@/lib/services/facilityService";
import type { FacilitySearchParams, FacilitySearchResponse } from "@/lib/types/facility";

let locationClient: LocationServiceClient | null = null;
let facilityService: FacilityService | null = null;

function getFacilityService(): FacilityService {
  if (!facilityService) {
    // Access Google API key directly from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GOOGLE_PLACES_API_KEY is not configured. Please set it in your environment variables."
      );
    }

    locationClient = new LocationServiceClient(apiKey);
    facilityService = new FacilityService(locationClient);
  }

  return facilityService;
}

export async function searchFacilitiesAction(
  params: FacilitySearchParams
): Promise<FacilitySearchResponse & { error?: string }> {
  try {
    // Validate zip code
    if (!params.zip_code || params.zip_code.length !== 5) {
      return {
        facilities: [],
        total: 0,
        zip_code: params.zip_code || "",
        error: "Invalid zip code. Must be 5 digits.",
      };
    }

    const service = getFacilityService();
    const result = await service.searchFacilities(
      params.zip_code,
      params.radius || 25,
      params.service_type || null,
      params.autism_only ?? true,
      params.pageToken || null
    );

    return result;
  } catch (error) {
    console.error("Error searching facilities:", error);
    return {
      facilities: [],
      total: 0,
      zip_code: params.zip_code || "",
      error: error instanceof Error ? error.message : "Failed to search facilities",
    };
  }
}
