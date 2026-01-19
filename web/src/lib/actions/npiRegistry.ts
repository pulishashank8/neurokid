"use server";

/**
 * NPI Registry API - Free US Healthcare Provider Directory
 * No API key required - official government database
 * Documentation: https://npiregistry.cms.hhs.gov/api-page
 */

export interface NPIProvider {
  npi: string;
  name: string;
  type: string; // "Individual" or "Organization"
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  specialty?: string;
  taxonomy?: string;
}

export interface NPISearchParams {
  zipCode: string;
  taxonomy?: string; // Specialty code
  state?: string;
  city?: string;
  organizationName?: string;
  limit?: number;
}

export interface NPISearchResponse {
  providers: NPIProvider[];
  total: number;
  error?: string;
}

/**
 * Search NPI Registry for healthcare providers
 * Completely free, no API key needed
 */
export async function searchNPIRegistry(
  params: NPISearchParams
): Promise<NPISearchResponse> {
  try {
    const { zipCode, taxonomy, state, city, organizationName, limit = 20 } = params;

    // Build query parameters
    const queryParams = new URLSearchParams({
      version: "2.1",
      postal_code: zipCode,
      limit: limit.toString(),
    });

    if (taxonomy) queryParams.append("taxonomy_description", taxonomy);
    if (state) queryParams.append("state", state);
    if (city) queryParams.append("city", city);
    if (organizationName) queryParams.append("organization_name", organizationName);

    // Call NPI Registry API
    const response = await fetch(
      `https://npiregistry.cms.hhs.gov/api/?${queryParams.toString()}`,
      {
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`NPI API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    // Transform NPI data to our format
    const providers: NPIProvider[] = results.map((result: any) => {
      const address = result.addresses?.find((a: any) => a.address_purpose === "LOCATION") || 
                     result.addresses?.[0] || {};
      const taxonomy = result.taxonomies?.[0] || {};
      
      return {
        npi: result.number,
        name: result.basic?.organization_name || 
              `${result.basic?.first_name || ""} ${result.basic?.last_name || ""}`.trim(),
        type: result.enumeration_type === "NPI-1" ? "Individual" : "Organization",
        address: `${address.address_1 || ""} ${address.address_2 || ""}`.trim(),
        city: address.city || "",
        state: address.state || "",
        zip: address.postal_code?.substring(0, 5) || "",
        phone: address.telephone_number || "",
        specialty: taxonomy.desc || "",
        taxonomy: taxonomy.code || "",
      };
    });

    return {
      providers,
      total: data.result_count || 0,
    };
  } catch (error) {
    console.error("NPI Registry search error:", error);
    return {
      providers: [],
      total: 0,
      error: error instanceof Error ? error.message : "Failed to search providers",
    };
  }
}
