import { parseISO, format } from 'date-fns';
// export default function Date({ dateString }) {
//     const date = parseISO(dateString);
//     return <time dateTime={dateString}>{format(date, 'LLLL d, yyyy')}</time>;
// }
/* 
This handles both a raw string (from markdown files) and a Date object (from the database).
Note: date.toISOString() works on Date objects; for string inputs we already have the original string in dateTime.
*/
export default function Date({ dateString }: { dateString: string | Date }) {
  // Convert Date object to ISO string if needed
  const date = typeof dateString === 'string' 
    ? parseISO(dateString) 
    : dateString;
  return <time dateTime={date.toISOString()}>{format(date, 'LLLL d, yyyy')}</time>;
}