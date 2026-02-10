/**
 * Virtual List Component
 * 
 * Efficiently renders large lists by only mounting visible items.
 * Uses fixed height estimation for smooth scrolling.
 * 
 * Usage:
 *   <VirtualList
 *     items={posts}
 *     renderItem={(post) => <PostCard post={post} />}
 *     itemHeight={200}
 *   />
 */

"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  className?: string;
  containerHeight?: number | string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  emptyMessage?: string;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  className,
  containerHeight = "600px",
  overscan = 5,
  onEndReached,
  endReachedThreshold = 200,
  emptyMessage = "No items",
  loading = false,
  loadingComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightValue, setContainerHeightValue] = useState(0);

  // Update container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeightValue(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Calculate visible range
  const { virtualItems, totalHeight, startIndex, endIndex } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeightValue / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

    const virtualItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: "absolute" as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }));

    return { virtualItems, totalHeight, startIndex, endIndex };
  }, [items, itemHeight, scrollTop, containerHeightValue, overscan]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);

      // Check if end reached
      if (onEndReached) {
        const scrollBottom = newScrollTop + containerHeightValue;
        const threshold = totalHeight - endReachedThreshold;
        if (scrollBottom >= threshold) {
          onEndReached();
        }
      }
    },
    [containerHeightValue, totalHeight, endReachedThreshold, onEndReached]
  );

  if (items.length === 0 && !loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          className
        )}
        style={{ height: containerHeight }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {virtualItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {loading && loadingComponent}
    </div>
  );
}

/**
 * Window Virtual List
 * Uses window scroll instead of container scroll
 */
interface WindowVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  className?: string;
  overscan?: number;
}

export function WindowVirtualList<T>({
  items,
  renderItem,
  itemHeight,
  className,
  overscan = 5,
}: WindowVirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollTop(window.scrollY);
    const handleResize = () => setWindowHeight(window.innerHeight);

    handleResize();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { virtualItems, totalHeight, paddingTop } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(windowHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

    const paddingTop = startIndex * itemHeight;

    const virtualItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));

    return { virtualItems, totalHeight, paddingTop };
  }, [items, itemHeight, scrollTop, windowHeight, overscan]);

  return (
    <div className={className} style={{ height: totalHeight, paddingTop }}>
      {virtualItems.map(({ item, index }) => (
        <div key={index} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
