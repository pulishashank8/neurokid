/**
 * Dynamic Imports
 * 
 * Lazy-loaded components for code splitting.
 * Use these for heavy components that aren't needed on initial load.
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading fallback component
function LoadingFallback({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-full w-full" />
    </div>
  );
}

// ===========================================
// Heavy Components - Lazy Loaded
// ===========================================

/**
 * AI Chat Component - Heavy due to markdown parsing and streaming
 */
export const LazyAIChat = dynamic(
  () => import("@/features/ai/AIChat").then((mod) => mod.AIChat),
  {
    ssr: false,
    loading: () => <LoadingFallback className="h-[500px]" />,
  }
);

/**
 * Map Components - Heavy due to map libraries
 */
export const LazyProviderMap = dynamic(
  () => import("@/features/providers/ProviderMap").then((mod) => mod.ProviderMap),
  {
    ssr: false,
    loading: () => <LoadingFallback className="h-[400px]" />,
  }
);

/**
 * Chart Components - Heavy due to charting libraries
 */
export const LazyAnalyticsCharts = dynamic(
  () => import("@/features/analytics/AnalyticsCharts").then((mod) => mod.AnalyticsCharts),
  {
    ssr: false,
    loading: () => <LoadingFallback className="h-[300px]" />,
  }
);

/**
 * Data Catalog Components - Heavy tables
 */
export const LazyDataCatalogTable = dynamic(
  () => import("@/features/data-catalog/DataCatalogTable").then((mod) => mod.DataCatalogTable),
  {
    loading: () => <LoadingFallback className="h-[500px]" />,
  }
);

/**
 * Rich Text Editor - Heavy due to editor library
 */
export const LazyRichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <LoadingFallback className="h-[300px]" />,
  }
);

/**
 * Emoji Picker - Heavy due to emoji data
 */
export const LazyEmojiPicker = dynamic(
  () => import("@/components/emoji/EmojiPicker").then((mod) => mod.EmojiPicker),
  {
    ssr: false,
    loading: () => <div className="h-[300px] w-[300px] bg-muted animate-pulse rounded-lg" />,
  }
);

/**
 * Image Editor - Heavy due to canvas manipulation
 */
export const LazyImageEditor = dynamic(
  () => import("@/components/image-editor/ImageEditor").then((mod) => mod.ImageEditor),
  {
    ssr: false,
    loading: () => <LoadingFallback className="h-[400px]" />,
  }
);

/**
 * Video Player - Heavy due to video libraries
 */
export const LazyVideoPlayer = dynamic(
  () => import("@/components/video/VideoPlayer").then((mod) => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => <LoadingFallback className="h-[300px] aspect-video" />,
  }
);

/**
 * Calendar Components - Heavy due to calendar logic
 */
export const LazyCalendar = dynamic(
  () => import("@/components/calendar/Calendar").then((mod) => mod.Calendar),
  {
    loading: () => <LoadingFallback className="h-[400px]" />,
  }
);

/**
 * Therapy Session Charts
 */
export const LazyTherapyCharts = dynamic(
  () => import("@/features/therapy/TherapyCharts").then((mod) => mod.TherapyCharts),
  {
    ssr: false,
    loading: () => <LoadingFallback className="h-[300px]" />,
  }
);

// ===========================================
// Page Components - Route Level Splitting
// ===========================================

/**
 * Games Pages - Heavy game logic
 */
export const LazyGameCanvas = dynamic(
  () => import("@/features/games/GameCanvas").then((mod) => mod.GameCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    ),
  }
);

/**
 * AAC Board - Heavy grid component
 */
export const LazyAACBoard = dynamic(
  () => import("@/features/aac/AACBoard").then((mod) => mod.AACBoard),
  {
    loading: () => <LoadingFallback className="h-[600px]" />,
  }
);

// ===========================================
// Modal Components - Loaded on demand
// ===========================================

/**
 * Settings Modal
 */
export const LazySettingsModal = dynamic(
  () => import("@/components/modals/SettingsModal").then((mod) => mod.SettingsModal),
  {
    ssr: false,
  }
);

/**
 * Share Modal
 */
export const LazyShareModal = dynamic(
  () => import("@/components/modals/ShareModal").then((mod) => mod.ShareModal),
  {
    ssr: false,
  }
);

/**
 * Help Modal
 */
export const LazyHelpModal = dynamic(
  () => import("@/components/modals/HelpModal").then((mod) => mod.HelpModal),
  {
    ssr: false,
  }
);

// ===========================================
// Utility HOC for Dynamic Imports
// ===========================================

interface WithDynamicImportOptions {
  ssr?: boolean;
  loading?: React.ReactNode;
}

/**
 * Higher-order component for dynamic imports
 */
export function withDynamicImport<T extends object>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options: WithDynamicImportOptions = {}
) {
  const { ssr = true, loading } = options;

  return dynamic(importFn, {
    ssr,
    loading: loading
      ? () => <>{loading}</>
      : undefined,
  });
}

// ===========================================
// Dynamic Page Imports
// ===========================================

export const DynamicAdminDashboard = dynamic(
  () => import("@/app/admin/dashboard/page"),
  {
    loading: () => <LoadingFallback className="h-screen" />,
  }
);

export const DynamicOwnerDashboard = dynamic(
  () => import("@/app/owner/dashboard/page"),
  {
    loading: () => <LoadingFallback className="h-screen" />,
  }
);
