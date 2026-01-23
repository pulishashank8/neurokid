"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Stethoscope,
  MapPin,
  Phone,
  Search,
  Hospital,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Navigation,
  Activity,
  UserCheck
} from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-[var(--primary)] animate-pulse" />
          <p className="text-lg font-medium text-[var(--muted)]">Locating specialists...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) return null;

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
    <div className="min-h-screen bg-[var(--background)] pt-20 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] py-8 sm:py-12 mb-6 sm:mb-8">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
          <div className="space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <UserCheck className="w-3 h-3" />
              Verified Network
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text)] tracking-tight">Care Compass</h1>
            <p className="max-w-2xl text-base sm:text-lg text-[var(--muted)] leading-relaxed">
              Connect with neurodiversity-friendly healthcare providers and specialists using our NPI-backed registry.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Search Bar */}
        <div className="sticky top-[4.5rem] z-30 mb-8 sm:mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-4 sm:p-6 backdrop-blur-md shadow-lg">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-12 items-end">
            <div className="md:col-span-4 relative">
              <label className="block text-[10px] sm:text-xs font-bold text-[var(--muted)] mb-1.5 sm:mb-2 uppercase tracking-tighter">Target Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <MapPin className="h-4 w-4 text-[var(--muted)]" />
                </div>
                <input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replaceAll(/\D/g, ""))}
                  placeholder="Enter ZIP"
                  maxLength={5}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-4 py-3 sm:py-3.5 text-sm sm:text-base focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all font-bold placeholder:font-normal"
                />
              </div>
            </div>

            <div className="md:col-span-5 relative">
              <label className="block text-[10px] sm:text-xs font-bold text-[var(--muted)] mb-1.5 sm:mb-2 uppercase tracking-tighter">Service Specialty</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Stethoscope className="h-4 w-4 text-[var(--muted)]" />
                </div>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-10 py-3 sm:py-3.5 text-sm sm:text-base appearance-none focus:border-[var(--primary)] outline-none transition-all cursor-pointer font-bold truncate"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--muted)]">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <button
                onClick={handleSearch}
                disabled={loading || zipCode.length !== 5}
                className="w-full rounded-xl sm:rounded-2xl bg-emerald-600 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 stroke-[2.5px]" />
                )}
                {loading ? "Searching..." : "Search Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Status / Error */}
        {error && (
          <div className="mb-8 rounded-2xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-900">Search Error</p>
              <p className="text-sm text-rose-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {providers.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-[var(--muted)]">
              Found <span className="font-bold text-[var(--text)]">{providers.length}</span> {total && total > providers.length ? `of ${total}` : ''} specialists near <span className="text-[var(--primary)] font-bold">{zipCode}</span>
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {providers.map((provider, i) => (
            <div
              key={`${provider.npi}-${i}`}
              className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--primary)]/30"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] transition-all duration-300">
                  <Hospital className="w-5 h-5" />
                </div>
                {provider.specialty && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                    {provider.specialty.split(' - ')[0]}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug mb-3">
                  {provider.name}
                </h2>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-sm text-[var(--muted)]">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span className="leading-relaxed">
                      {provider.address}<br />
                      <span className="font-bold text-[var(--text)]">{provider.city}, {provider.state} {provider.zip}</span>
                    </span>
                  </div>

                  {provider.phone && (
                    <div className="flex items-center gap-2.5 text-base text-[var(--text)] font-extrabold tracking-tight">
                      <Phone className="w-5 h-5 shrink-0 text-emerald-600" />
                      {provider.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3 pt-5 border-t border-[var(--border)]">
                {provider.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ' ' + provider.address + ' ' + provider.city + ' ' + provider.state)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-2xl bg-[var(--surface2)] px-6 py-3.5 text-base font-bold text-[var(--text)] hover:bg-[var(--primary)] hover:text-white transition-all flex items-center justify-center gap-2.5 border-2 border-[var(--border)]"
                  >
                    <Navigation className="w-5 h-5" />
                    Directions
                  </a>
                )}
                {provider.phone && (
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex-1 rounded-2xl bg-emerald-600 px-6 py-3.5 text-base font-black !text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-xl shadow-emerald-500/40"
                  >
                    <Phone className="w-5 h-5 stroke-[3px] !text-white" />
                    <span className="!text-white">Call Now</span>
                  </a>
                )}
              </div>
            </div>
          ))}

          {!loading && providers.length === 0 && (
            <div className="col-span-full mt-8 rounded-3xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)]">Begin your search</h3>
              <p className="mt-3 text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
                Enter your ZIP code above to discover local specialists. We connect you with verified data from the National Provider Registry.
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer Area */}
        <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-8 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-2">Network Disclaimer</h3>
              <p className="text-sm text-amber-800 leading-relaxed opacity-90">
                This directory dynamically leverages data from the official US National Provider Identifier (NPI) registry maintained by CMS.
                NeuroKind is an information hub and does not endorse specific providers or provide medical advice.
                <span className="block mt-2 font-bold">Recommended steps:</span> Always verify credentials, neuro-inclusive practices, and insurance coverage direct with the provider before scheduling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
