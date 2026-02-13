'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Client Component for the "Send Report Now" button
 * Handles the async API call with loading state and feedback
 */
export function ReportActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/owner/cofounder/trigger', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Report generated successfully!');
        // Refresh the page data to show the new report
        router.refresh();
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to generate report');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error - please try again');
    } finally {
      setLoading(false);
      // Auto-clear status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleGenerateReport}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Mail size={16} />
            Send Report Now
          </>
        )}
      </button>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
          <CheckCircle size={14} />
          {message}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
          <AlertCircle size={14} />
          {message}
        </div>
      )}
    </div>
  );
}
