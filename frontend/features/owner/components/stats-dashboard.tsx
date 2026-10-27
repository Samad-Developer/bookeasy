'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { useOwnerStats } from '@/features/owner/hooks';
import { getErrorMessage } from '@/lib/api-client';
import { formatCount, formatMonth, formatPercent, formatPkr } from '@/lib/format';

export function StatsDashboard() {
  const { data, isPending, isError, error, refetch } = useOwnerStats();

  if (isPending) return <StatsSkeleton />;

  if (isError) {
    return (
      <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p className="text-destructive">{getErrorMessage(error, 'Could not load your statistics.')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { summary, venues, byMonth } = data;

  if (summary.venues === 0) {
    return (
      <div className="space-y-3 py-4">
        <p className="text-lg font-medium">You have not listed a venue yet.</p>
        <p className="text-muted-foreground">Add your first venue, then add slots so customers can book it.</p>
        <Link href="/owner/venues/new" className={buttonVariants()}>
          Add a venue
        </Link>
      </div>
    );
  }

  const tiles = [
    { label: 'Upcoming bookings', value: formatCount(summary.upcomingBookings) },
    { label: 'Revenue (confirmed)', value: formatPkr(summary.revenuePkr) },
    { label: 'Slots booked', value: formatPercent(summary.occupancyRate), hint: `${summary.bookedSlots} of ${summary.totalSlots} slots` },
    { label: 'Venues', value: formatCount(summary.venues), hint: `${summary.activeVenues} visible to customers` },
  ];

  return (
    <div className="space-y-10">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="space-y-1 border-t pt-3">
            <dt className="text-sm text-muted-foreground">{tile.label}</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">{tile.value}</dd>
            {tile.hint && <dd className="text-xs text-muted-foreground">{tile.hint}</dd>}
          </div>
        ))}
      </dl>

      <p className="text-sm text-muted-foreground">
        {formatCount(summary.confirmedBookings)} confirmed and {formatCount(summary.cancelledBookings)} cancelled bookings in total.
      </p>

      <section aria-labelledby="by-venue" className="space-y-3">
        <h2 id="by-venue" className="text-xl font-semibold tracking-tight">
          By venue
        </h2>
        <ul className="divide-y border-y">
          {venues.map((venue) => (
            <li key={venue.venueId} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
              <Link href={`/owner/venues/${venue.venueId}/slots`} className="font-medium underline-offset-4 hover:underline">
                {venue.venueName}
              </Link>
              <span className="text-sm text-muted-foreground">
                {venue.bookedSlots} of {venue.totalSlots} slots booked ({formatPercent(venue.occupancyRate)}) ·{' '}
                {venue.confirmedBookings} confirmed · {venue.cancelledBookings} cancelled
              </span>
              <span className="tabular-nums">{formatPkr(venue.revenuePkr)}</span>
            </li>
          ))}
        </ul>
      </section>

      {byMonth.length > 0 && (
        <section aria-labelledby="by-month" className="space-y-3">
          <h2 id="by-month" className="text-xl font-semibold tracking-tight">
            By month
          </h2>
          <p className="text-sm text-muted-foreground">Grouped by the month of the event, not the day it was booked.</p>
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

function StatsSkeleton() {
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