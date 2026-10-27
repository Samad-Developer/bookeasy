import { format, isSameDay, isToday, isTomorrow } from 'date-fns';

// Formatting helpers. Create the Intl formatters ONCE (they are slow to create, fast to use).
const pkr = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });
const count = new Intl.NumberFormat('en-PK');

// 150000 -> "Rs 150,000"
export const formatPkr = (amount: number) => pkr.format(amount);

// 1500 -> "1,500"
export const formatCount = (value: number) => count.format(value);

// The API sends times as UTC strings like "2026-11-01T14:00:00.000Z".
// date-fns shows them in the VISITOR's own time zone (Pakistan time for your users).

// "Saturday, 1 November"
export const formatDayHeading = (date: Date) => format(date, 'EEEE, d MMMM');

export function relativeDayLabel(date: Date): string | null {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return null;
}

// "7:00 PM – 11:00 PM", and "9:00 PM – 1:00 AM (next day)" for a wedding that runs past midnight
export function formatTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const range = `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
  return isSameDay(start, end) ? range : `${range} (next day)`;
}

// 75 -> "75%", 66.7 -> "66.7%"
export const formatPercent = (value: number) => `${value}%`;

// "2026-11" -> "November 2026"  (the API groups statistics by month)
export function formatMonth(month: string) {
  const [year, number] = month.split('-').map(Number);
  return format(new Date(year, number - 1, 1), 'MMMM yyyy');
}