'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  formatInTimezone,
  getUserTimezone,
  type DateFormatStyle,
} from '@/lib/date-utils';

const TimezoneContext = createContext<string | null>(null);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    const tz = getUserTimezone();
    setTimeZone(tz);
    document.cookie = `tz=${encodeURIComponent(tz)};path=/;max-age=31536000;samesite=lax`;
  }, []);

  return (
    <TimezoneContext.Provider value={timeZone}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone(): string {
  const tz = useContext(TimezoneContext);
  return tz ?? (typeof window !== 'undefined' ? getUserTimezone() : 'UTC');
}

/** Hook for formatting dates in user's timezone. Use in client components. */
export function useFormatDate() {
  const timeZone = useTimezone();
  return {
    formatDate: (date: string | Date, style: DateFormatStyle = 'date') =>
      formatInTimezone(date, timeZone, style),
    formatTime: (date: string | Date) =>
      formatInTimezone(date, timeZone, 'time'),
    formatDateTime: (date: string | Date) =>
      formatInTimezone(date, timeZone, 'dateTime'),
    timeZone,
  };
}
