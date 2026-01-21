"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, MapPin, Phone, Stethoscope, AlertCircle, Building2 } from "lucide-react";

// ============================================================================
// NEW IMPLEMENTATION: Free NPI Registry API (No API key required)
// ============================================================================
import { searchNPIRegistry, type NPIProvider } from "@/lib/actions/npiRegistry";
import { AUTISM_SPECIALTIES } from "@/lib/constants/specialties";

// New NPI Registry specialty options (autism/neurodiversity focused)
const TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "All Specialties", value: "ALL" },
  ...AUTISM_SPECIALTIES.map(specialty => ({ label: specialty, value: specialty })),
];

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

  // Redirect to login if not authenticated - AFTER all hooks
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/providers");
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <p className="mt-4 text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  // ============================================================================
  // NPI Registry search handler
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

  return (
    <div className="min-h-screen pt-20 pb-6 sm:pt-24 sm:pb-12 bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">Healthcare Provider Finder</h1>
          <p className="mt-3 text-lg text-[var(--muted)] max-w-3xl">
            Search local neurodiversity-friendly healthcare providers near you using the official NPI Registry data.
          </p>
        </div>

        {/* Search Controls */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm mb-8">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-12 items-end">
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">ZIP Code</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replaceAll(/\D/g, ""))}
                  placeholder="Enter ZIP code"
                  maxLength={5}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] pl-10 pr-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] outline-none transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-5">
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">Specialty</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] pl-10 pr-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] outline-none transition-all appearance-none cursor-pointer"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)] text-xs">▼</div>
              </div>
            </div>

            <div className="md:col-span-4">
              <button
                onClick={handleSearch}
                disabled={loading || zipCode.length !== 5}
                className="w-full rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {loading ? "Searching..." : "Search Providers"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Results Counter */}
        {providers.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--text)]">Search Results</h2>
            <span className="text-sm px-3 py-1 rounded-full bg-[var(--surface2)] text-[var(--muted)] font-medium">
              Showing {providers.length} {total && total > providers.length ? `of ${total}` : ''} providers
            </span>
          </div>
        )}

        {/* Provider Grid */}
        <ul className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {providers.map((provider, index) => (
            <li key={`${provider.npi}-${index}`} className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)] transition-all duration-300">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-[var(--surface2)] text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                    <Building2 className="w-6 h-6" />
                  </div>
                  {provider.specialty && (
                    <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-md uppercase tracking-wide text-right">
                      {provider.specialty}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[var(--text)] leading-tight mb-3">
                  {provider.name}
                </h3>

                <div className="space-y-2 text-sm text-[var(--muted)]">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
                    <p>
                      {provider.address}
                      {provider.city && <span className="block">{provider.city}, {provider.state} {provider.zip}</span>}
                    </p>
                  </div>

                  {provider.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0 opacity-70" />
                      <p>{provider.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-3">
                {provider.phone && (
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[var(--surface2)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                )}

                {provider.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ' ' + provider.address + ' ' + provider.city + ' ' + provider.state)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors ${!provider.phone ? 'col-span-2' : ''}`}
                  >
                    <MapPin className="w-4 h-4" /> Directions
                  </a>
                ) : (
                  <div className="col-span-2">
                    <span className="text-xs text-[var(--muted)] text-center block">Address not available</span>
                  </div>
                )}
              </div>
            </li>
          ))}

          {/* Empty State */}
          {!loading && providers.length === 0 && (
            <li className="col-span-full py-16 text-center rounded-3xl border-2 border-dashed border-[var(--border)] bg-[var(--surface2)]/50">
              <div className="mx-auto w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mb-4 shadow-sm text-[var(--muted)]">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)]">No providers found yet</h3>
              <p className="text-[var(--muted)] max-w-md mx-auto mt-2">
                Enter a ZIP code above and select a specialty to find the best care for your needs.
              </p>
            </li>
          )}
        </ul>

        {/* Disclaimer */}
        <div className="mt-12 rounded-xl bg-orange-500/10 border border-orange-500/20 p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-orange-700 dark:text-orange-300 mb-1">Standard Disclaimer</h4>
              <p className="text-sm text-orange-700/80 dark:text-orange-300/80 leading-relaxed">
                This directory uses data from the official US National Provider Identifier (NPI) database maintained by CMS.
                NeuroKid does not endorse specific providers and does not provide medical advice.
                Always verify credentials, services, availability, and insurance coverage directly with providers before scheduling appointments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
