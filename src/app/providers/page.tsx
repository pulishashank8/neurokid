"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, MapPin, Phone, Navigation, Building2, Stethoscope, AlertTriangle } from "lucide-react";

import { searchNPIRegistry, type NPIProvider } from "@/lib/actions/npiRegistry";
import { AUTISM_SPECIALTIES } from "@/lib/constants/specialties";

const TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "All Specialties", value: "ALL" },
  ...AUTISM_SPECIALTIES.map(specialty => ({ label: specialty, value: specialty })),
];

export default function ProvidersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [zipCode, setZipCode] = useState("");
  const [specialty, setSpecialty] = useState<string>("ALL");
  const [providers, setProviders] = useState<NPIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/providers");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--surface2)]" />
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[var(--primary)] animate-spin absolute inset-0" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

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
    <div className="min-h-screen bg-[var(--background)] pt-32">
      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--surface)] to-[var(--background)] border-b border-[var(--border)] pt-8 pb-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-[var(--primary)]/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider w-fit mb-4">
              <Stethoscope className="w-3.5 h-3.5" />
              Provider Directory
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight mb-4">
              Healthcare <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Provider Finder</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
              Search local neurodiversity-friendly healthcare providers near you using the NPI Registry.
            </p>
          </div>

          <div className="bg-[var(--surface)] glass rounded-2xl border border-[var(--border)] p-6 shadow-premium">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">ZIP Code</label>
                <div className={`relative transition-all duration-300 ${searchFocused ? "transform scale-[1.01]" : ""}`}>
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replaceAll(/\D/g, ""))}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Enter ZIP code"
                    maxLength={5}
                    className={`w-full px-4 py-3.5 pl-12 bg-[var(--surface2)] border-2 rounded-xl text-[var(--text)] placeholder-[var(--muted)] transition-all duration-300 text-sm ${searchFocused
                        ? "border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10"
                        : "border-[var(--border)] hover:border-[var(--primary)]/30"
                      }`}
                  />
                  <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchFocused ? "text-[var(--primary)]" : "text-[var(--muted)]"
                    }`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">Specialty</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[var(--surface2)] border-2 border-[var(--border)] rounded-xl text-[var(--text)] transition-all duration-300 text-sm hover:border-[var(--primary)]/30 focus:border-[var(--primary)] focus:shadow-lg focus:shadow-[var(--primary)]/10 appearance-none cursor-pointer"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading || zipCode.length !== 5}
                  className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-[var(--primary)] text-white font-semibold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[var(--primary)]/25 flex items-center justify-center gap-2 btn-premium"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search Providers
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 animate-fade-up">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400">Error</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {providers.length > 0 && (
          <div className="mb-6 flex items-center gap-2">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
              <Building2 className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <p className="text-sm text-[var(--muted)]">
              Showing <span className="font-semibold text-[var(--text)]">{providers.length}</span>
              {total && total > providers.length ? ` of ${total}` : ''} providers
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {providers.map((provider, index) => (
            <article
              key={`${provider.npi}-${index}`}
              className="group relative bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-premium hover:shadow-premium-hover card-3d overflow-hidden transition-all duration-300"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-[var(--text)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                      {provider.name}
                    </h2>
                    {provider.specialty && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
                          {provider.specialty}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-[var(--muted)] mb-5">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--primary)]" />
                    <p className="leading-relaxed">
                      {provider.address}
                      {provider.city && `, ${provider.city}`}
                      {provider.state && ` ${provider.state}`}
                      {provider.zip && ` ${provider.zip}`}
                    </p>
                  </div>
                  {provider.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0 text-[var(--primary)]" />
                      <p>{provider.phone}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {provider.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ' ' + provider.address + ' ' + provider.city + ' ' + provider.state)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface2)] text-[var(--text)] text-sm font-semibold hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-all duration-200 group/btn"
                    >
                      <Navigation className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      Maps
                    </a>
                  )}
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200"
                    >
                      <Phone className="w-4 h-4 text-white" />
                      <span className="text-white">Call</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}

          {!loading && providers.length === 0 && (
            <div className="col-span-full">
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface2)]/30 p-12 text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shadow-premium">
                    <Search className="w-8 h-8 text-[var(--muted)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Find Healthcare Providers</h3>
                  <p className="text-[var(--muted)] max-w-md mx-auto">
                    Enter a ZIP code and click "Search Providers" to discover healthcare providers in your area.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 relative overflow-hidden rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl h-fit">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Disclaimer</p>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/70 leading-relaxed">
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
