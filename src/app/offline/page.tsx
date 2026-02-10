'use client';

import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          It looks like you&apos;ve lost your internet connection. 
          Don&apos;t worry - some features are still available offline.
        </p>

        {/* Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Status: {isOnline ? 'Back Online!' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={handleRefresh}
            className="w-full gap-2"
            disabled={!isOnline}
          >
            <RefreshCw className="w-4 h-4" />
            {isOnline ? 'Try Again' : 'Waiting for Connection...'}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>

            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full gap-2">
                <MessageSquare className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Offline Features */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Available Offline:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>✓ AAC Communication Board</li>
            <li>✓ Emergency Information Card</li>
            <li>✓ Previously loaded posts</li>
            <li>✓ Daily Win logs (saved locally)</li>
          </ul>
        </div>

        {/* Tips */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your posts and messages will be sent automatically when you reconnect.
        </p>
      </div>
    </div>
  );
}
