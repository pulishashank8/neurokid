"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Heart,
  ExternalLink,
  BookOpen,
  Users,
  Scale,
  Stethoscope,
  Brain,
  Sparkles,
  Info,
  Clock,
  ChevronRight
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import toast from "react-hot-toast";

type Resource = {
  id: string;
  title: string;
  category: string;
  content: string | null;
  link: string | null;
  views: number;
  createdAt: string;
  _count?: {
    savedBy: number;
  };
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  EDUCATION: { label: "Education", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  THERAPY: { label: "Therapy", icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-50" },
  NUTRITION: { label: "Nutrition", icon: Brain, color: "text-green-600", bg: "bg-green-50" },
  BEHAVIOR: { label: "Behavior", icon: Sparkles, color: "text-orange-600", bg: "bg-orange-50" },
  SLEEP: { label: "Sleep", icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50" },
  SOCIAL_SKILLS: { label: "Social Skills", icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
  LEGAL: { label: "Legal", icon: Scale, color: "text-red-600", bg: "bg-red-50" },
  FINANCIAL: { label: "Financial", icon: Scale, color: "text-yellow-600", bg: "bg-yellow-50" },
  COMMUNITY: { label: "Community", icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
  OTHER: { label: "General", icon: Info, color: "text-gray-600", bg: "bg-gray-50" },
};

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "ALL" },
  ...Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({ label: cfg.label, value: key }))
];

/** Format save count for display: 1000 → "1K", 1500 → "1.5K", 1200000 → "1.2M" */
function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function ResourcesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialSaved = searchParams.get("saved") === "1";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [resources, setResources] = useState<Resource[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showSavedOnly, setShowSavedOnly] = useState(initialSaved);

  const fetchSavedIds = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/resources/save");
      const data = await res.json();
      if (data.savedIds) setSavedIds(new Set(data.savedIds));
    } catch {
      // keep existing savedIds
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resResponse, savedResponse] = await Promise.all([
          showSavedOnly && session
            ? fetch("/api/resources?savedOnly=1")
            : fetch("/api/resources"),
          session ? fetch("/api/resources/save") : Promise.resolve(null)
        ]);

        const resData = await resResponse.json();
        if (resData.resources) {
          setResources(resData.resources);
        }

        if (savedResponse) {
          const savedData = await savedResponse.json();
          if (savedData.savedIds) {
            setSavedIds(new Set(savedData.savedIds));
          }
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, showSavedOnly]);

  const handleShowSavedOnly = () => {
    const next = !showSavedOnly;
    setShowSavedOnly(next);
    if (next) {
      setSelectedCategory("ALL");
      setSearch("");
      fetchSavedIds();
    }
  };

  const toggleSave = async (e: React.MouseEvent, resourceId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      window.location.href = "/login?callbackUrl=/resources";
      return;
    }

    try {
      const response = await fetch("/api/resources/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Could not save. Please try again.");
        return;
      }
      if (data.saved !== undefined) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (data.saved) next.add(resourceId);
          else next.delete(resourceId);
          return next;
        });

        setResources(prev => prev.map(r => {
          if (r.id === resourceId) {
            const currentCount = r._count?.savedBy || 0;
            return {
              ...r,
              _count: { savedBy: data.saved ? currentCount + 1 : Math.max(0, currentCount - 1) }
            };
          }
          return r;
        }));
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Could not save. Please try again.");
    }
  };

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (showSavedOnly && !savedIds.has(r.id)) return false;
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          (r.content && r.content.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search, selectedCategory, resources, savedIds, showSavedOnly]);

  return (
    <div className="min-h-screen bg-[var(--background)] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-4">
        <BackButton fallbackPath="/care-compass" />
      </div>
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] py-8 sm:py-12 mb-6 sm:mb-8">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Knowledge Base
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">Resources</h1>
              <p className="max-w-xl text-base sm:text-lg text-[var(--muted)] leading-relaxed">
                A curated library of tools and guides for neurodivergent families and providers.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  if (!session?.user && !showSavedOnly) {
                    toast.error("Sign in to see your saved resources.");
                    return;
                  }
                  handleShowSavedOnly();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium text-sm ${showSavedOnly
                  ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
              >
                <Heart className={`w-4 h-4 ${showSavedOnly ? "fill-current" : ""}`} />
                {showSavedOnly ? "Showing Saved" : "Saved Resources"}
                {savedIds.size > 0 && (
                  <span className="ml-1 min-w-[1.25rem] rounded-full bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-600">
                    {savedIds.size}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="sticky top-24 z-30 mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-4 backdrop-blur-md shadow-lg">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-12 items-center">
            <div className="relative md:col-span-12 lg:col-span-7">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-[var(--muted)]" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-4 py-3 text-sm sm:text-base focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
              />
            </div>
            <div className="relative md:col-span-12 lg:col-span-5 flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Filter className="h-4 w-4 text-[var(--muted)]" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-8 py-3 text-sm sm:text-base appearance-none focus:border-[var(--primary)] outline-none transition-all cursor-pointer truncate"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
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
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-[var(--muted)]">
            {showSavedOnly ? (
              <>
                Showing <span className="font-bold text-[var(--text)]">{filtered.length}</span> saved resource{filtered.length !== 1 ? "s" : ""}
                {savedIds.size > 0 && filtered.length === 0 && selectedCategory !== "ALL" && (
                  <span> — try &quot;All Categories&quot; to see all saved</span>
                )}
              </>
            ) : (
              <>
                Found <span className="font-bold text-[var(--text)]">{filtered.length}</span> resources
                {selectedCategory !== "ALL" && <span> in <span className="text-[var(--primary)]">{CATEGORY_CONFIG[selectedCategory]?.label}</span></span>}
              </>
            )}
          </div>
        </div>

        {loading && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-[var(--surface2)] animate-pulse border border-[var(--border)]"></div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((resource) => {
              const cfg = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.OTHER;
              const Icon = cfg.icon;
              const isSaved = savedIds.has(resource.id);

              return (
                <div
                  key={resource.id}
                  className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--primary)]/30"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleSave(e, resource.id)}
                      aria-label={isSaved ? "Unsave resource" : "Save resource"}
                      className={`p-2 rounded-lg transition-all ${isSaved
                        ? "bg-rose-50 text-rose-500 shadow-inner"
                        : "bg-[var(--surface2)] text-[var(--muted)] hover:bg-rose-50 hover:text-rose-500"
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <div className="flex-1">
                    {resource.link ? (
                      <a
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded-lg -m-1 p-1"
                      >
                        <h3 className="text-lg font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug mb-2">
                          {resource.title}
                        </h3>
                      </a>
                    ) : (
                      <h3 className="text-lg font-bold text-[var(--text)] leading-snug mb-2">
                        {resource.title}
                      </h3>
                    )}
                    <p className="text-sm text-[var(--muted)] line-clamp-3 leading-relaxed mb-4">
                      {resource.content || "No detailed description available."}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-3 text-[10px] text-[var(--muted)] font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </span>
                      {resource._count && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          {formatCompactCount(resource._count.savedBy)}
                        </span>
                      )}
                    </div>
                    {resource.link && (
                      <a
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline active:scale-95 transition-all"
                      >
                        Access Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-12 rounded-3xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface2)] text-[var(--muted)]">
              {showSavedOnly ? <Heart className="h-8 w-8" /> : <Search className="h-8 w-8" />}
            </div>
            <h3 className="text-lg font-bold text-[var(--text)]">
              {showSavedOnly
                ? (session?.user ? "No saved resources yet" : "Sign in to see saved resources")
                : "No resources found"}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {showSavedOnly
                ? (session?.user
                  ? "Click the heart on any resource to save it, then you’ll see it here."
                  : "Sign in to save resources and view them in one place.")
                : "Try adjusting your search or category."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--background)] pt-20">Loading directory...</div>}>
      <ResourcesContent />
    </Suspense>
  );
}
