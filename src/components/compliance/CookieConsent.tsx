"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Settings, Check } from "lucide-react";
import Link from "next/link";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  accepted: boolean;
}

const STORAGE_KEY = "cookie-consent-v1";

const defaultPreferences: CookiePreferences = {
  essential: true, // Always required
  functional: true,
  analytics: true,
  accepted: false,
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        if (!parsed.accepted) {
          setIsVisible(true);
        }
      } catch {
        setIsVisible(true);
      }
    } else {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);
    setShowSettings(false);

    // Apply preferences (disable analytics if not consented)
    if (!prefs.analytics) {
      // Disable Vercel Analytics for this user
      window.localStorage.setItem("vercel-analytics-enabled", "false");
    }
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      functional: true,
      analytics: true,
      accepted: true,
    });
  };

  const acceptSelected = () => {
    savePreferences({
      ...preferences,
      accepted: true,
    });
  };

  const declineNonEssential = () => {
    savePreferences({
      essential: true,
      functional: false,
      analytics: false,
      accepted: true,
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Main Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-300">
          {!showSettings ? (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text)] text-sm md:text-base">
                    We value your privacy
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--muted)] mt-0.5">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content.{" "}
                    <Link href="/cookies" className="text-[var(--primary)] hover:underline">
                      Learn more
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 md:flex-none px-3 py-2 text-xs md:text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  <Settings className="w-4 h-4 inline mr-1" />
                  Settings
                </button>
                <button
                  onClick={declineNonEssential}
                  className="flex-1 md:flex-none px-3 py-2 text-xs md:text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 md:flex-none px-4 py-2 bg-[var(--primary)] text-white text-xs md:text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Accept All
                </button>
              </div>
            </div>
          ) : (
            /* Settings Panel */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text)]">Cookie Preferences</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-[var(--muted)] hover:text-[var(--text)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Essential - Always On */}
                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-lg">
                  <div>
                    <h4 className="font-medium text-[var(--text)] text-sm">Essential</h4>
                    <p className="text-xs text-[var(--muted)]">Required for the website to function</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted)]">Always On</span>
                    <div className="w-10 h-6 bg-[var(--primary)] rounded-full flex items-center justify-end p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Functional */}
                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-lg">
                  <div>
                    <h4 className="font-medium text-[var(--text)] text-sm">Functional</h4>
                    <p className="text-xs text-[var(--muted)]">Remember your preferences</p>
                  </div>
                  <button
                    onClick={() => setPreferences(p => ({ ...p, functional: !p.functional }))}
                    className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${
                      preferences.functional ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.functional ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-lg">
                  <div>
                    <h4 className="font-medium text-[var(--text)] text-sm">Analytics</h4>
                    <p className="text-xs text-[var(--muted)]">Help us improve our website</p>
                  </div>
                  <button
                    onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                    className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${
                      preferences.analytics ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.analytics ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={acceptSelected}
                  className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Hook to check if analytics is enabled
export function useAnalyticsConsent(): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEnabled(parsed.analytics !== false);
      } catch {
        setEnabled(true);
      }
    }
  }, []);

  return enabled;
}
