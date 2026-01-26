'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SearchStats {
  recentSearches: {
    id: string;
    query: string;
    searchType: string;
    resultsCount: number | null;
    createdAt: string;
    user: {
      email: string;
      profile: { username: string; displayName: string } | null;
    } | null;
  }[];
  searchesByType: { searchType: string; _count: { id: number } }[];
  topQueries: { query: string; count: number }[];
}

export default function SearchAnalyticsPage() {
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSearchStats();
  }, []);

  async function fetchSearchStats() {
    try {
      const res = await fetch('/api/owner/stats?type=searches');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/owner/login';
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await res.json();
      if (data.recentSearches !== undefined) {
        setStats(data);
      } else {
        setStats({ recentSearches: [], searchesByType: [], topQueries: [] });
      }
    } catch (error) {
      console.error('Error fetching search stats:', error);
      setError('Failed to load search analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <Search size={48} className="mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Search Analytics</h1>
        <p className="text-gray-500">See what users are searching for</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(stats?.searchesByType || []).map((type) => (
          <div key={type.searchType} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Search className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 capitalize">{type.searchType} Searches</p>
                <p className="text-2xl font-bold text-gray-800">{type._count.id}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-green-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Top Search Queries</h2>
          </div>
          
          {stats?.topQueries && stats.topQueries.length > 0 ? (
            <div className="space-y-3">
              {stats.topQueries.map((query, index) => (
                <div key={query.query} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                    <span className="text-gray-800">{query.query}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">{query.count} searches</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Search size={48} className="mx-auto mb-2 opacity-50" />
              <p>No search data yet</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Recent Searches</h2>
          </div>
          
          {stats?.recentSearches && stats.recentSearches.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.recentSearches.slice(0, 20).map((search) => (
                <div key={search.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{search.query}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {search.searchType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {search.user?.profile?.displayName || search.user?.email || 'Anonymous'}
                    </span>
                    <span>{format(new Date(search.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Clock size={48} className="mx-auto mb-2 opacity-50" />
              <p>No recent searches</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
