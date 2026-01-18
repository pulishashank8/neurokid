/**
 * Location Service Client for Google Geocoding and Places API
 * TypeScript port of the Python LocationServiceClient
 */

import type {
  Coordinates,
  GooglePlaceResult,
  GoogleAddressComponent,
} from "../types/facility";

const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchNearby";

const AUTISM_KEYWORDS = [
  "autism",
  "asd",
  "aba",
  "applied behavior analysis",
  "behavior analysis",
  "behavioral therapy",
  "behavioral health",
  "developmental pediatrics",
  "special needs",
];

export class LocationServiceClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Convert a US zip code to latitude/longitude coordinates using Google Geocoding API
   */
  async geocodeZipCode(zipCode: string): Promise<Coordinates> {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", zipCode);
    url.searchParams.set("components", "country:US");
    url.searchParams.set("key", this.apiKey);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      } else {
        throw new Error(`No geocoding results for zip code: ${zipCode}`);
      }
    } catch (error) {
      throw new Error(
        `Error calling Geocoding API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search for places near coordinates using Google Places API
   */
  async searchPlacesNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    includedTypes?: string[],
    maxResults: number = 20,
    pageToken?: string | null
  ): Promise<{ places: GooglePlaceResult[]; nextPageToken?: string }> {
    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": this.apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.nationalPhoneNumber",
        "places.types",
        "places.websiteUri",
        "places.businessStatus",
        "places.userRatingCount",
        "places.addressComponents",
      ].join(","),
    };

    const defaultTypes = [
      "hospital",
      "doctor",
      "medical_lab",
      "physiotherapist",
    ];

    const body = {
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: radiusMeters,
        },
      },
      includedTypes: includedTypes || defaultTypes,
      maxResultCount: Math.min(maxResults, 20),
      rankPreference: "DISTANCE",
      ...(pageToken && { pageToken }),
    };

    try {
      const response = await fetch(PLACES_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error(
            "Places API access forbidden. Please enable 'Places API (New)' " +
              "in Google Cloud Console and ensure billing is enabled."
          );
        } else if (response.status === 400) {
          throw new Error(`Bad request to Places API: ${errorText}`);
        }
        throw new Error(
          `Error calling Places API (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();
      const places: GooglePlaceResult[] = data.places || [];
      const nextPageToken = data.nextPageToken;

      // Calculate distance for each place
      places.forEach((place) => {
        if (place.location) {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            place.location.latitude,
            place.location.longitude
          );
          place.distance_miles = distance;
        }
      });

      return { places, nextPageToken };
    } catch (error) {
      throw new Error(
        `Error calling Places API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search for autism service facilities near a zip code
   */
  async searchFacilities(
    zipCode: string,
    radiusMiles: number = 25,
    autismOnly: boolean = true,
    pageToken?: string | null
  ): Promise<{
    results: GooglePlaceResult[];
    center: Coordinates;
    zip_code: string;
    radius_miles: number;
    total_before_autism_filter: number;
    total_after_autism_filter: number;
    nextPageToken?: string;
  }> {
    // Convert zip code to coordinates
    const coordinates = await this.geocodeZipCode(zipCode);

    // Convert miles to meters
    const radiusMeters = Math.round(radiusMiles * 1609.34);

    const includedTypes = [
      "hospital",
      "doctor",
      "medical_lab",
      "physiotherapist",
    ];

    const { places, nextPageToken } = await this.searchPlacesNearby(
      coordinates.lat,
      coordinates.lng,
      radiusMeters,
      includedTypes,
      20,
      pageToken
    );

    const totalBeforeFilter = places.length;

    // Filter for autism-related places if requested
    let filteredPlaces = places;
    if (autismOnly) {
      filteredPlaces = places.filter((place) => this.isAutismRelatedPlace(place));
    }

    return {
      results: filteredPlaces,
      center: coordinates,
      zip_code: zipCode,
      radius_miles: radiusMiles,
      total_before_autism_filter: totalBeforeFilter,
      total_after_autism_filter: filteredPlaces.length,
      nextPageToken,
    };
  }

  /**
   * Determine if a place is likely autism-related based on keywords
   */
  private isAutismRelatedPlace(place: GooglePlaceResult): boolean {
    const textParts: string[] = [];

    // Extract display name
    if (place.displayName) {
      if (typeof place.displayName === "object" && "text" in place.displayName) {
        textParts.push(place.displayName.text);
      } else if (typeof place.displayName === "string") {
        textParts.push(place.displayName);
      }
    }

    // Add website
    if (place.websiteUri) {
      textParts.push(place.websiteUri);
    }

    // Add place types
    if (place.types && Array.isArray(place.types)) {
      textParts.push(...place.types);
    }

    const combinedText = textParts.join(" ").toLowerCase();
    return AUTISM_KEYWORDS.some((keyword) => combinedText.includes(keyword));
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959.0; // Earth's radius in miles

    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
