/**
 * Route Prefetcher
 * 
 * Prefetches likely navigation targets for instant page transitions.
 * Uses Next.js router prefetch with visibility and hover detection.
 * 
 * Usage:
 *   <RoutePrefetcher />
 *   
 *   Or with Link component:
 *   <PrefetchLink href="/dashboard">Dashboard</PrefetchLink>
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Routes to prefetch on page load
const HIGH_PRIORITY_ROUTES = [
  "/",
  "/community",
  "/resources",
  "/messages",
  "/profile",
];

// Routes to prefetch on idle
const LOW_PRIORITY_ROUTES = [
  "/autism-navigator",
  "/aac",
  "/daily-wins",
  "/therapy-log",
];

/**
 * Prefetch high priority routes on mount
 */
export function RoutePrefetcher() {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRoutes = useRef<Set<string>>(new Set());

  const prefetchRoute = useCallback(
    (href: string) => {
      if (prefetchedRoutes.current.has(href) || href === pathname) {
        return;
      }
      
      try {
        router.prefetch(href);
        prefetchedRoutes.current.add(href);
      } catch {
        // Silent fail - prefetching is optimization
      }
    },
    [router, pathname]
  );

  useEffect(() => {
    // Prefetch high priority routes immediately
    HIGH_PRIORITY_ROUTES.forEach(prefetchRoute);

    // Prefetch low priority routes on idle
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleCallback = requestIdleCallback(() => {
        LOW_PRIORITY_ROUTES.forEach(prefetchRoute);
      });
      return () => cancelIdleCallback(idleCallback);
    } else {
      // Fallback for Safari
      const timeout = setTimeout(() => {
        LOW_PRIORITY_ROUTES.forEach(prefetchRoute);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [prefetchRoute]);

  return null;
}

/**
 * PrefetchLink - Link component with hover prefetch
 */
export function PrefetchLink({
  href,
  children,
  className,
  prefetch = true,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
} & React.ComponentProps<typeof Link>) {
  const router = useRouter();
  const hasPrefetched = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (prefetch && !hasPrefetched.current) {
      try {
        router.prefetch(href);
        hasPrefetched.current = true;
      } catch {
        // Silent fail
      }
    }
  }, [router, href, prefetch]);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * VisibleLink - Prefetches when link becomes visible
 */
export function VisibleLink({
  href,
  children,
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<typeof Link>) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (!linkRef.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPrefetched.current) {
            try {
              router.prefetch(href);
              hasPrefetched.current = true;
            } catch {
              // Silent fail
            }
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px" }
    );

    observer.observe(linkRef.current);
    return () => observer.disconnect();
  }, [href, router]);

  return (
    <Link ref={linkRef} href={href} className={className} {...props}>
      {children}
    </Link>
  );
}
