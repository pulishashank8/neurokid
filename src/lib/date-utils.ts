/**
 * Timezone-aware date formatting utilities.
 * Uses the user's browser-detected timezone (from Intl) for display.
 * All dates are stored as UTC in the database; these functions convert to user's local time.
 */

export type DateFormatStyle =
  | 'date'          // e.g. Jan 15, 2025
  | 'dateShort'     // e.g. Jan 15
  | 'time'          // e.g. 2:30 PM
  | 'dateTime'      // e.g. Jan 15, 2025, 2:30 PM
  | 'dateTimeShort' // e.g. Jan 15, 2:30 PM
  | 'weekdayDate'   // e.g. Monday, January 15
  | 'full';         // e.g. Monday, January 15, 2025, 2:30:45 PM IST

const FORMAT_OPTIONS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
  date: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  dateShort: {
    month: 'short',
    day: 'numeric',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  },
  dateTime: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  },
  dateTimeShort: {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short', // e.g. "IST", "EST", "AEDT"
  },
  weekdayDate: {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  },
  full: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  },
};

/**
 * Format a date in the user's timezone.
 * @param date - ISO string, Date, or timestamp
 * @param timeZone - IANA timezone (e.g. "Asia/Kolkata", "America/New_York")
 * @param style - Preset format style
 */
export function formatInTimezone(
  date: string | Date | number,
  timeZone: string,
  style: DateFormatStyle = 'dateTime'
): string {
  const d = typeof date === 'object' && 'getTime' in date
    ? date
    : new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  const formatted = new Intl.DateTimeFormat(undefined, {
    ...FORMAT_OPTIONS[style],
    timeZone,
  }).format(d);
  
  // Replace GMT offset with proper timezone abbreviation for dateTimeShort and full styles
  if (style === 'dateTimeShort' || style === 'full') {
    const tzAbbr = getTimezoneAbbreviation(timeZone);
    // Replace any GMT offset pattern with the proper abbreviation
    return formatted.replace(/GMT[+-]\d+/, tzAbbr);
  }
  
  return formatted;
}

/**
 * Format date with custom options.
 */
export function formatInTimezoneWithOptions(
  date: string | Date | number,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'object' && 'getTime' in date
    ? date
    : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone,
  }).format(d);
}

/**
 * Get the user's timezone from the browser (client-side only).
 * Returns IANA timezone string e.g. "Asia/Kolkata", "America/New_York".
 */
export function getUserTimezone(): string {
  if (typeof window === 'undefined') return 'UTC';
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Get timezone abbreviation (EST, IST, PST, etc.) for a given IANA timezone.
 */
export function getTimezoneAbbreviation(timeZone: string = getUserTimezone()): string {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    });
    
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    
    if (tzPart && tzPart.value) {
      // If it's a GMT offset like "GMT-5", convert to proper abbreviation
      if (tzPart.value.startsWith('GMT')) {
        return convertGMTToAbbreviation(timeZone, tzPart.value);
      }
      return tzPart.value;
    }
    
    return 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Convert GMT offset to proper timezone abbreviation.
 */
function convertGMTToAbbreviation(timeZone: string, gmtOffset: string): string {
  // Common timezone mappings
  const timezoneMap: Record<string, string> = {
    'America/New_York': 'EST',
    'America/Chicago': 'CST',
    'America/Denver': 'MST',
    'America/Los_Angeles': 'PST',
    'America/Phoenix': 'MST',
    'America/Anchorage': 'AKST',
    'Pacific/Honolulu': 'HST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Berlin': 'CET',
    'Asia/Kolkata': 'IST',
    'Asia/Calcutta': 'IST',
    'Asia/Dubai': 'GST',
    'Asia/Shanghai': 'CST',
    'Asia/Tokyo': 'JST',
    'Asia/Singapore': 'SGT',
    'Asia/Hong_Kong': 'HKT',
    'Australia/Sydney': 'AEDT',
    'Australia/Melbourne': 'AEDT',
    'Australia/Brisbane': 'AEST',
    'Australia/Perth': 'AWST',
    'Pacific/Auckland': 'NZDT',
  };
  
  // Check if timezone is daylight saving
  const now = new Date();
  const january = new Date(now.getFullYear(), 0, 1);
  const july = new Date(now.getFullYear(), 6, 1);
  
  const janOffset = january.toLocaleString('en-US', { timeZone, timeZoneName: 'short' });
  const julyOffset = july.toLocaleString('en-US', { timeZone, timeZoneName: 'short' });
  
  // If we have a mapping, use it
  if (timezoneMap[timeZone]) {
    let abbr = timezoneMap[timeZone];
    
    // Handle daylight saving for US timezones
    if (timeZone.startsWith('America/') && !timeZone.includes('Phoenix')) {
      // Check if currently in DST
      const isDST = !janOffset.includes('GMT') || janOffset !== julyOffset;
      if (isDST && abbr.endsWith('ST')) {
        abbr = abbr.replace('ST', 'DT'); // EST -> EDT, PST -> PDT, etc.
      }
    }
    
    // Handle Australian timezones
    if (timeZone.startsWith('Australia/')) {
      const isDST = janOffset !== julyOffset;
      if (abbr.includes('AEDT') || abbr.includes('AEST')) {
        return isDST ? 'AEDT' : 'AEST';
      }
    }
    
    return abbr;
  }
  
  // Fallback to GMT offset
  return gmtOffset;
}
