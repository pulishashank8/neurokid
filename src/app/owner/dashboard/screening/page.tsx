'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface ScreeningStats {
  totalScreenings: number;
  screeningsByType: { screeningType: string; _count: { id: number } }[];
  screenings: { screeningType: string; riskLevel: string | null; _count: { id: number } }[];
}

export default function ScreeningStatsPage() {
  const [stats, setStats] = useState<ScreeningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScreeningStats();
  }, []);

  async function fetchScreeningStats() {
    try {
      const res = await fetch('/api/owner/stats?type=screening');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Session expired. Please log in again.');
          window.location.href = '/owner/login';
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await res.json();
      if (data.totalScreenings !== undefined) {
        setStats(data);
      } else {
        setStats({ totalScreenings: 0, screeningsByType: [], screenings: [] });
      }
    } catch (error) {
      console.error('Error fetching screening stats:', error);
      setError('Failed to load screening statistics');
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
          <AlertTriangle size={48} className="mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const riskColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const riskIcons: Record<string, React.ReactNode> = {
    low: <CheckCircle className="text-green-500" size={20} />,
    medium: <AlertCircle className="text-yellow-500" size={20} />,
    high: <AlertTriangle className="text-red-500" size={20} />,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Screening Tool Statistics</h1>
        <p className="text-gray-500">Track autism screening completions and results</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardList className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Screenings</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.totalScreenings || 0}</p>
            </div>
          </div>
        </div>

        {stats?.screeningsByType.map((type) => (
          <div key={type.screeningType} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ClipboardList className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{type.screeningType}</p>
                <p className="text-2xl font-bold text-gray-800">{type._count.id}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Results by Risk Level</h2>
        
        {stats?.screenings && stats.screenings.length > 0 ? (
          <div className="space-y-4">
            {stats.screenings.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {riskIcons[result.riskLevel || 'low'] || riskIcons.low}
                  <div>
                    <p className="font-medium text-gray-800">{result.screeningType}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${riskColors[result.riskLevel || 'low'] || riskColors.low}`}>
                      {result.riskLevel || 'Unknown'} risk
                    </span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-800">{result._count.id}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <ClipboardList size={48} className="mx-auto mb-2 opacity-50" />
            <p>No screening data available yet</p>
            <p className="text-sm mt-1">Screening results will appear here as users complete assessments</p>
          </div>
        )}
      </div>
    </div>
  );
}
