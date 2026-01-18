/**
 * Custom React hook for fetching facilities using server action
 * Usage: const { facilities, loading, error, searchFacilities, loadMore } = useFacilities();
 */

import { useState, useCallback } from "react";
import { searchFacilitiesAction } from "../actions/facilities";
import type {
  Facility,
  FacilitySearchParams,
} from "../types/facility";

interface UseFacilitiesReturn {
  facilities: Facility[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  searchFacilities: (params: FacilitySearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function useFacilities(): UseFacilitiesReturn {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<FacilitySearchParams | null>(null);

  const searchFacilities = useCallback(
    async (params: FacilitySearchParams) => {
      setLoading(true);
      setError(null);
      setLastParams(params);

      try {
        const result = await searchFacilitiesAction(params);
        
        if (result.error) {
          throw new Error(result.error);
        }

        setFacilities(result.facilities || []);
        setTotal(result.total || 0);
        setNextPageToken(result.nextPageToken || null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        setFacilities([]);
        setTotal(0);
        setNextPageToken(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadMore = useCallback(async () => {
    if (!nextPageToken || !lastParams || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await searchFacilitiesAction({
        ...lastParams,
        pageToken: nextPageToken,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setFacilities(prev => [...prev, ...(result.facilities || [])]);
      setTotal(prev => prev + (result.total || 0));
      setNextPageToken(result.nextPageToken || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [nextPageToken, lastParams, loading]);

  const reset = useCallback(() => {
    setFacilities([]);
    setError(null);
    setTotal(0);
    setLoading(false);
    setNextPageToken(null);
    setLastParams(null);
  }, []);

  return {
    facilities,
    loading,
    error,
    total,
    hasMore: !!nextPageToken,
    searchFacilities,
    loadMore,
    reset,
  };
}
