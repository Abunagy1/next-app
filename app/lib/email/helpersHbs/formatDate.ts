import { formatInTimeZone } from 'date-fns-tz';

export default function formatDate(
  timestamp: any,              // accept anything
  timezone: string,
  formatStr: string = 'dd MMMM yyyy'
): string {
  if (!timestamp) return '';

  let date: Date;

  try {
    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // Try to parse as a Unix timestamp (ms) first, then as an ISO string
      const num = parseInt(timestamp, 10);
      date = isNaN(num) ? new Date(timestamp) : new Date(num);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '';
    }

    if (isNaN(date.getTime())) return '';
    return formatInTimeZone(date, timezone, formatStr);
  } catch {
    return '';
  }
}