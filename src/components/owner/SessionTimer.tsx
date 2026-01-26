'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_THRESHOLD = 2 * 60 * 1000; // 2 minutes warning
const ACTIVITY_REFRESH_INTERVAL = 60 * 1000; // Refresh session every 1 minute of activity
const SYNC_INTERVAL = 30 * 1000; // Sync with server every 30 seconds

export default function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [showWarning, setShowWarning] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const lastActivityRefresh = useRef(Date.now());
  const lastActivity = useRef(Date.now());

  const logout = useCallback(async () => {
    try {
      await fetch('/api/owner/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    window.location.href = '/owner/login?expired=true';
  }, []);

  const syncWithServer = useCallback(async () => {
    try {
      const response = await fetch('/api/owner/session-status');
      const data = await response.json();
      
      if (!data.authenticated || data.timeRemaining <= 0) {
        logout();
        return;
      }
      
      setTimeLeft(data.timeRemaining);
      setInitialized(true);
    } catch (error) {
      console.error('Session sync error:', error);
    }
  }, [logout]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/owner/refresh-session', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok && data.timeRemaining) {
        setTimeLeft(data.timeRemaining);
        setShowWarning(false);
        lastActivityRefresh.current = Date.now();
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, []);

  const handleActivity = useCallback(() => {
    lastActivity.current = Date.now();
    
    // Refresh server session if enough time has passed since last refresh
    if (Date.now() - lastActivityRefresh.current > ACTIVITY_REFRESH_INTERVAL) {
      refreshSession();
    }
  }, [refreshSession]);

  // Initialize by syncing with server
  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  // Set up activity listeners
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity]);

  // Timer countdown and periodic sync
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1000;
        
        if (newTime <= WARNING_THRESHOLD && newTime > 0) {
          setShowWarning(true);
        }
        
        if (newTime <= 0) {
          logout();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    // Periodic server sync
    const syncInterval = setInterval(syncWithServer, SYNC_INTERVAL);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(syncInterval);
    };
  }, [logout, syncWithServer]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  if (!initialized) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      showWarning ? 'animate-pulse' : ''
    }`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-xl border shadow-lg ${
        showWarning 
          ? 'bg-red-500/20 border-red-500/30 text-red-400' 
          : 'bg-slate-800/80 border-white/10 text-slate-400'
      }`}>
        {showWarning ? (
          <AlertTriangle size={16} className="text-red-400" />
        ) : (
          <Clock size={16} />
        )}
        <span className="text-sm font-medium tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        {showWarning && (
          <span className="text-xs font-medium">Session expiring</span>
        )}
      </div>
    </div>
  );
}
