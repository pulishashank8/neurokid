"use client";
import { useMemo, useState } from "react";
import { useFacilities } from "@/lib/facilities";
// import providersData from "@/data/providers.json";

const TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "All Types", value: "ALL" },
  { label: "Mental Health Services", value: "Mental Health Services" },
  { label: "Primary Care", value: "Primary Care" },
  { label: "Physical Therapy", value: "Physical Therapy" },
  { label: "Rehabilitation Services", value: "Rehabilitation Services" },
  { label: "Medical Services", value: "Medical Services" },
];

function normalize(str: string) {
  return str.toLowerCase().trim();
}

export default function ProvidersPage() {
  const [query, setQuery] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState(25);
  const [serviceType, setServiceType] = useState<string>("ALL");
  const [limit, setLimit] = useState(24);

  // Use facility search hook
  const { facilities, loading, error, hasMore, searchFacilities, loadMore } = useFacilities();

  // Handle search
  const handleSearch = async () => {
    if (zipCode.length === 5) {
      await searchFacilities({
        zip_code: zipCode,
        radius: radius,
        service_type: serviceType === "ALL" ? null : serviceType,
        autism_only: false,
      });
    }
  };

  // Filter facilities by query
  const filtered = useMemo(() => {
    const q = normalize(query);
    return facilities
      .filter((f) => {
        if (q) {
          const hay = normalize(`${f.name} ${f.address} ${f.city} ${f.zip_code} ${f.services.join(" ")}`);
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .slice(0, limit);
  }, [facilities, query, limit]);

  return (
    <div className="min-h-screen pt-20 pb-6 sm:pt-24 sm:pb-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Provider Finder</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Search local neurodiversity-friendly providers near you using Google Places.
        </p>

        <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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
              {loading ? "Searching..." : "Search Providers"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {facilities.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {facilities.length} facilities
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                className="flex-1 sm:flex-none rounded-md border px-3 py-2 text-sm min-h-[44px]"
                onClick={() => setLimit((l) => Math.max(12, l - 12))}
                disabled={limit <= 12}
              >
                Show Less
              </button>
              <button
                className="flex-1 sm:flex-none rounded-md border px-3 py-2 text-sm min-h-[44px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                onClick={() => {
                  if (filtered.length >= facilities.length && hasMore) {
                    loadMore();
                  } else {
                    setLimit((l) => l + 12);
                  }
                }}
                disabled={loading || (filtered.length >= facilities.length && !hasMore)}
              >
                {loading ? "Loading..." : (filtered.length >= facilities.length && hasMore) ? "Load More from API" : "Show More"}
              </button>
            </div>
          </div>
        )}

        <ul className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((facility) => (
            <li key={facility.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h2 className="text-base font-semibold">{facility.name}</h2>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {facility.services.map((service) => (
                      <span
                        key={service}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                  {facility.rating && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⭐ {facility.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm">
                <p>
                  {facility.address}
                  {facility.city && `, ${facility.city}`}
                  {facility.state && ` ${facility.state}`}
                  {facility.zip_code && ` ${facility.zip_code}`}
                </p>
                {facility.phone && <p className="mt-1">📞 {facility.phone}</p>}
                {facility.distance && (
                  <p className="mt-1 text-muted-foreground">
                    📍 {facility.distance.toFixed(1)} miles away
                  </p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                {facility.latitude && facility.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-md border px-3 py-2 text-xs sm:text-sm text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50"
                  >
                    Maps
                  </a>
                )}
                {facility.phone && (
                  <a
                    href={`tel:${facility.phone}`}
                    className="flex-1 rounded-md border px-3 py-2 text-xs sm:text-sm text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50"
                  >
                    Call
                  </a>
                )}
                {facility.website && (
                  <a
                    href={facility.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-md border px-3 py-2 text-xs sm:text-sm text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50"
                  >
                    Website
                  </a>
                )}
              </div>
            </li>
          ))}
          {!loading && facilities.length === 0 && (
            <li className="rounded-lg border p-4 text-sm text-muted-foreground col-span-full text-center py-12">
              Enter a ZIP code and click "Search Providers" to find facilities nearby.
            </li>
          )}
          {!loading && filtered.length === 0 && facilities.length > 0 && (
            <li className="rounded-lg border p-4 text-sm text-muted-foreground col-span-full text-center">
              No facilities match your filter.
            </li>
          )}
        </ul>

        <div className="mt-8 rounded-md bg-amber-50 p-4 text-sm">
          <p className="font-medium">Disclaimer</p>
          <p className="mt-1 text-amber-900">
            This directory is for general guidance only. NeuroKind does not
            endorse specific providers and does not provide medical advice. Verify
            services, credentials, availability, and insurance coverage directly
            with providers.
          </p>
        </div>
      </div>
    </div>
  );
}
