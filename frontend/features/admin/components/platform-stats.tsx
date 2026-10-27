'use client';

import { Button } from '@/components/ui/button';
import { usePlatformStats } from '@/features/admin/hooks';
import { getErrorMessage } from '@/lib/api-client';
import { formatCount, formatMonth, formatPercent, formatPkr } from '@/lib/format';

const ROLE_LABELS: Record<string, string> = { customer: 'Customers', owner: 'Owners', admin: 'Admins' };

export function PlatformStats() {
  const { data, isPending, isError, error, refetch } = usePlatformStats();

  if (isPending) {
    return (
      <div role="status" aria-label="Loading statistics" className="space-y-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-20 animate-pulse rounded bg-muted" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p className="text-destructive">{getErrorMessage(error, 'Could not load the statistics.')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { summary, topVenues, byMonth, byWeekday, usersByRole } = data;
  const busiestDay = Math.max(1, ...byWeekday.map((day) => day.bookings));
  const totalUsers = usersByRole.reduce((sum, row) => sum + row.total, 0);

  const tiles = [
    { label: 'Revenue (confirmed)', value: formatPkr(summary.revenuePkr) },
    { label: 'Confirmed bookings', value: formatCount(summary.confirmedBookings), hint: `${formatCount(summary.cancelledBookings)} cancelled` },
    { label: 'Slots booked', value: formatPercent(summary.occupancyRate), hint: `${formatCount(summary.bookedSlots)} of ${formatCount(summary.totalSlots)} slots` },
    { label: 'Venues', value: formatCount(summary.venues), hint: `${formatCount(summary.activeVenues)} visible to customers` },
  ];

  return (
    <div className="space-y-10">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="space-y-1 border-t pt-3">
            <dt className="text-sm text-muted-foreground">{tile.label}</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">{tile.value}</dd>
            <dd className="text-xs text-muted-foreground">{tile.hint ?? '\u00a0'}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="users-heading" className="space-y-3">
        <h2 id="users-heading" className="text-xl font-semibold tracking-tight">
          Users
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatCount(totalUsers)} accounts:{' '}
          {usersByRole.map((row) => `${formatCount(row.total)} ${ROLE_LABELS[row.role]?.toLowerCase() ?? row.role}`).join(' · ')}
        </p>
      </section>

      <section aria-labelledby="top-venues" className="space-y-3">
        <h2 id="top-venues" className="text-xl font-semibold tracking-tight">
          Top venues by revenue
        </h2>
        {topVenues.length === 0 ? (
          <p className="text-muted-foreground">No venues yet.</p>
        ) : (
          <ol className="divide-y border-y">
            {topVenues.map((venue, index) => (
              <li key={venue.venueId} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                <span className="font-medium">
                  {index + 1}. {venue.venueName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {venue.confirmedBookings} confirmed · {formatPercent(venue.occupancyRate)} of slots booked
                </span>
                <span className="tabular-nums">{formatPkr(venue.revenuePkr)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="weekday-heading" className="space-y-3">
        <h2 id="weekday-heading" className="text-xl font-semibold tracking-tight">
          Bookings by weekday
        </h2>
        <p className="text-sm text-muted-foreground">The weekday of the event, not the day it was booked.</p>
        <ul className="space-y-2">
          {byWeekday.map((day) => (
            <li key={day.weekday} className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-3 text-sm">
              <span>{day.name}</span>
              <span aria-hidden className="h-2 rounded-full bg-muted">
                <span className="block h-2 rounded-full bg-foreground" style={{ width: `${(day.bookings / busiestDay) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{day.bookings}</span>
            </li>
          ))}
        </ul>
      </section>

      {byMonth.length > 0 && (
        <section aria-labelledby="month-heading" className="space-y-3">
          <h2 id="month-heading" className="text-xl font-semibold tracking-tight">
            By month
          </h2>
          <ul className="divide-y border-y">
            {byMonth.map((month) => (
              <li key={month.month} className="flex items-baseline justify-between gap-4 py-3">
                <span>{formatMonth(month.month)}</span>
                <span className="text-sm text-muted-foreground">
                  {month.bookings} {month.bookings === 1 ? 'booking' : 'bookings'}
                </span>
                <span className="tabular-nums">{formatPkr(month.revenuePkr)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}