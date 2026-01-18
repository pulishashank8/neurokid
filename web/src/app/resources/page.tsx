"use client";

import { useState, useMemo } from "react";

type Resource = {
  id: string;
  title: string;
  category: "EDUCATION" | "SUPPORT" | "TOOLS" | "SELF_ADVOCACY";
  description: string;
  url: string;
  external: boolean;
};

const RESOURCES: Resource[] = [
  {
    id: "r1",
    title: "Autism Society",
    category: "SUPPORT",
    description: "National organization providing support, advocacy, and resources for individuals with autism.",
    url: "https://www.autism-society.org",
    external: true,
  },
  {
    id: "r2",
    title: "ADHD Awareness Month",
    category: "EDUCATION",
    description: "Educational resources and community support for ADHD.",
    url: "https://www.adhdawarenessmonth.org",
    external: true,
  },
  {
    id: "r3",
    title: "Dyslexia International",
    category: "SUPPORT",
    description: "Global community supporting individuals with dyslexia.",
    url: "https://www.dyslexia-international.org",
    external: true,
  },
  {
    id: "r4",
    title: "The Mighty",
    category: "SUPPORT",
    description: "Community for sharing stories and support related to chronic illness and disabilities.",
    url: "https://www.themighty.com",
    external: true,
  },
  {
    id: "r5",
    title: "Self Advocacy Resources",
    category: "SELF_ADVOCACY",
    description: "Learn how to advocate for yourself in educational, workplace, and healthcare settings.",
    url: "#",
    external: false,
  },
  {
    id: "r6",
    title: "Accessibility Tools Guide",
    category: "TOOLS",
    description: "Curated list of accessibility tools and apps to support your daily life.",
    url: "#",
    external: false,
  },
  {
    id: "r7",
    title: "Neurodiversity Hub",
    category: "EDUCATION",
    description: "Educational content about neurodiversity and celebrating neurodivergent strengths.",
    url: "https://www.neurodiversityhub.org",
    external: true,
  },
  {
    id: "r8",
    title: "Crisis Resources",
    category: "SUPPORT",
    description: "Emergency support and crisis hotlines available 24/7.",
    url: "#",
    external: false,
  },
];

const CATEGORY_OPTIONS = [
  { label: "All Resources", value: "ALL" },
  { label: "Education", value: "EDUCATION" },
  { label: "Support Groups", value: "SUPPORT" },
  { label: "Tools & Apps", value: "TOOLS" },
  { label: "Self Advocacy", value: "SELF_ADVOCACY" },
];

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: "bg-blue-100 text-blue-700",
  SUPPORT: "bg-purple-100 text-purple-700",
  TOOLS: "bg-green-100 text-green-700",
  SELF_ADVOCACY: "bg-orange-100 text-orange-700",
};

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const filtered = useMemo(() => {
    return RESOURCES.filter((r) => {
      if (category !== "ALL" && r.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, category]);

  return (
    <div className="min-h-screen pt-20 pb-6 sm:pt-24 sm:pb-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Resources</h1>
          <p className="mt-2 text-base sm:text-lg text-gray-600">
            Discover educational materials, support networks, and tools to support your neurodivergent journey.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px]"
            >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="mb-4 text-sm text-gray-600">
        Showing {filtered.length} of {RESOURCES.length} resources
      </p>

      {/* Resource Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((resource) => (
          <a
            key={resource.id}
            href={resource.url}
            target={resource.external ? "_blank" : undefined}
            rel={resource.external ? "noopener noreferrer" : undefined}
            className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                  {resource.title}
                </h3>
                <p
                  className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                    CATEGORY_COLORS[resource.category]
                  }`}
                >
                  {resource.category.replace("_", " ")}
                </p>
              </div>
              {resource.external && (
                <svg
                  className="h-5 w-5 text-gray-400 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-600">
              {resource.description}
            </p>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No resources match your search.</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4 border border-blue-200">
        <p className="font-semibold text-blue-900">Information Disclaimer</p>
        <p className="mt-1 text-sm text-blue-800">
          NeuroKind provides these resources for informational purposes only. We
          do not endorse any particular organization or tool, nor do we provide
          medical advice. Please consult with qualified professionals for
          personalized guidance.
        </p>
      </div>
      </div>
    </div>
  );
}
