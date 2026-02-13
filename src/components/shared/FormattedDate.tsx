'use client';

import {
  formatInTimezone,
  getUserTimezone,
  type DateFormatStyle,
} from '@/lib/date-utils';
import { formatDistanceToNow } from 'date-fns';

interface FormattedDateProps {
  date: string | Date;
  style?: DateFormatStyle;
  relative?: boolean;
  className?: string;
}

/**
 * Displays a date in the user's local timezone.
 * Reads timezone directly from browser (India → IST, Australia → local, New York → EST).
 */
export function FormattedDate({
  date,
  style = 'dateTime',
  relative = false,
  className = '',
}: FormattedDateProps) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return <span className={className}>—</span>;

  const tz = typeof window !== 'undefined' ? getUserTimezone() : 'UTC';
  const formatted = formatInTimezone(d, tz, style);

  if (relative) {
    return (
      <span className={className} title={formatted} suppressHydrationWarning>
        {formatDistanceToNow(d, { addSuffix: true })}
      </span>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
}
