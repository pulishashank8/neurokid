"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ============================================================================
// NEW IMPLEMENTATION: Free NPI Registry API (No API key required)
// ============================================================================
import { searchNPIRegistry, type NPIProvider } from "@/lib/actions/npiRegistry";
import { AUTISM_SPECIALTIES } from "@/lib/constants/specialties";

// ============================================================================
// OLD IMPLEMENTATION: Google Places API (Requires paid API key) - COMMENTED OUT
// ============================================================================
// import { useFacilities } from "@/lib/facilities";
// import providersData from "@/data/providers.json";

// Old Google Places service type options
// const TYPE_OPTIONS: { label: string; value: string }[] = [
//   { label: "All Types", value: "ALL" },
//   { label: "Mental Health Services", value: "Mental Health Services" },
//   { label: "Primary Care", value: "Primary Care" },
//   { label: "Physical Therapy", value: "Physical Therapy" },
//   { label: "Rehabilitation Services", value: "Rehabilitation Services" },
//   { label: "Medical Services", value: "Medical Services" },
// ];

// New NPI Registry specialty options (autism/neurodiversity focused)
const TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "All Specialties", value: "ALL" },
  ...AUTISM_SPECIALTIES.map(specialty => ({ label: specialty, value: specialty })),
];

// Normalize function - commented out as no longer used with NPI Registry
// function normalize(str: string) {
//   return str.toLowerCase().trim();
// }

export default function ProvidersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [zipCode, setZipCode] = useState("");
  
  // ============================================================================
  // NEW IMPLEMENTATION: NPI Registry state
  // ============================================================================
  const [specialty, setSpecialty] = useState<string>("ALL");
  const [providers, setProviders] = useState<NPIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // ============================================================================
  // OLD IMPLEMENTATION: Google Places state - COMMENTED OUT
  // ============================================================================
  // const [radius, setRadius] = useState(25);
  // const [serviceType, setServiceType] = useState<string>("ALL");
  // const [limit, setLimit] = useState(24);
  // const { facilities, loading, error, hasMore, searchFacilities, loadMore } = useFacilities();

  // OLD Google Places filtering - COMMENTED OUT
  // const filtered = useMemo(() => {
  //   const q = normalize(query);
  //   return facilities
  //     .filter((f) => {
  //       if (q) {
  //         const hay = normalize(`${f.name} ${f.address} ${f.city} ${f.zip_code} ${f.services.join(" ")}`);
  //         if (!hay.includes(q)) return false;
  //       }
  //       return true;
  //     })
  //     .slice(0, limit);
  // }, [facilities, query, limit]);

  // Redirect to login if not authenticated - AFTER all hooks
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/providers");
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  // ============================================================================
  // NEW IMPLEMENTATION: NPI Registry search handler
  // ============================================================================
  const handleSearch = async () => {
    if (zipCode.length !== 5) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await searchNPIRegistry({
      zipCode,
      taxonomy: specialty === "ALL" ? undefined : specialty,
      limit: 50,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setProviders(result.providers);
      setTotal(result.total);
    }

    setLoading(false);
  };

  // ============================================================================
  // OLD IMPLEMENTATION: Google Places search handler - COMMENTED OUT
  // ============================================================================
  // const handleSearch = async () => {
  //   if (zipCode.length === 5) {
  //     await searchFacilities({
  //       zip_code: zipCode,
  //       radius: radius,
  //       service_type: serviceType === "ALL" ? null : serviceType,
  //       autism_only: false,
  //     });
  //   }
  // };

  return (
    <div className="min-h-screen pt-20 pb-6 sm:pt-24 sm:pb-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Healthcare Provider Finder</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Search local neurodiversity-friendly healthcare providers near you using the NPI Registry.
        </p>

        <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replaceAll(/\D/g, ""))}
              placeholder="Enter ZIP code"
              maxLength={5}
              className="w-full rounded-md border p-2 text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Specialty</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-md border p-2 text-sm min-h-[44px]"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {/* Filter Results - Commented out as NPI Registry handles filtering server-side */}
          {/* <div>
            <label className="block text-sm font-medium mb-1">Filter Results</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, address..."
              className="w-full rounded-md border p-2 text-sm min-h-[44px]"
            />
          </div> */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || zipCode.length !== 5}
              className="w-full rounded-md bg-blue-600 text-white px-4 py-2 text-sm min-h-[44px] disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search Providers"}
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* OLD IMPLEMENTATION: Google Places Search Form - COMMENTED OUT   */}
        {/* ================================================================ */}
        {/* <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter ZIP code"
              maxLength={5}
              className="w-full rounded-md border p-2 text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Radius (miles)</label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              min="1"
              max="100"
              className="w-full rounded-md border p-2 text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full rounded-md border p-2 text-sm min-h-[44px]"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filter Results</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, address..."
              className="w-full rounded-md border p-2 text-sm min-h-[44px]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || zipCode.length !== 5}
              className="w-full rounded-md bg-blue-600 text-white px-4 py-2 text-sm min-h-[44px] disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div> */}

        {/* ================================================================ */}
        {/* Error Display (Works for both implementations)                  */}
        {/* ================================================================ */}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {providers.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {providers.length} {total && total > providers.length ? `of ${total}` : ''} providers
            </p>
          </div>
        )}

        <ul className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider, index) => (
            <li key={`${provider.npi}-${index}`} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h2 className="text-base font-semibold">{provider.name}</h2>
                  {provider.specialty && (
                    <div className="mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {provider.specialty}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm">
                <p>
                  {provider.address}
                  {provider.city && `, ${provider.city}`}
                  {provider.state && ` ${provider.state}`}
                  {provider.zip && ` ${provider.zip}`}
                </p>
                {provider.phone && <p className="mt-1">📞 {provider.phone}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                {provider.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ' ' + provider.address + ' ' + provider.city + ' ' + provider.state)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-md border px-3 py-2 text-xs sm:text-sm text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50"
                  >
                    Maps
                  </a>
                )}
                {provider.phone && (
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex-1 rounded-md border px-3 py-2 text-xs sm:text-sm text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50"
                  >
                    Call
                  </a>
                )}
              </div>
            </li>
          ))}
          {!loading && providers.length === 0 && (
            <li className="rounded-lg border p-4 text-sm text-muted-foreground col-span-full text-center py-12">
              Enter a ZIP code and click "Search Providers" to find healthcare providers nearby.
            </li>
          )}
        </ul>

        {/* ================================================================ */}
        {/* OLD IMPLEMENTATION: Google Places Results - COMMENTED OUT       */}
        {/* ================================================================ */}
        {/* <ul className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((facility) => (
            <li
              key={facility.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900">{facility.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{facility.address}</p>
              <p className="text-sm text-gray-600">
                {facility.city}, {facility.state} {facility.zip_code}
              </p>
              {facility.services.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {facility.services.slice(0, 3).map((service, idx) => (
                    <span
                      key={idx}
                      className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                    >
                      {service}
                    </span>
                  ))}
                  {facility.services.length > 3 && (
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      +{facility.services.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
          {!loading && facilities.length === 0 && (
            <li className="col-span-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-600">
                Enter a ZIP code and click Search to find providers
              </p>
            </li>
          )}
          {!loading && filtered.length === 0 && facilities.length > 0 && (
            <li className="col-span-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-600">No providers match your filter</p>
            </li>
          )}
        </ul> */}

        {/* ================================================================ */}
        {/* Disclaimer (Updated for NPI Registry)                           */}
        {/* ================================================================ */}

        <div className="mt-8 rounded-md bg-amber-50 p-4 text-sm border border-amber-200">
          <p className="font-medium text-amber-900">Disclaimer</p>
          <p className="mt-1 text-amber-800">
            This directory uses data from the official US National Provider Identifier (NPI) database maintained by CMS. 
            NeuroKind does not endorse specific providers and does not provide medical advice. 
            Always verify credentials, services, availability, and insurance coverage directly with providers before scheduling appointments.
          </p>
        </div>
      </div>
    </div>
  );
}
