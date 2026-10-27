'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useCancelBooking, useMyBookings } from '@/features/bookings/hooks';
import type { Booking, BookingFilter } from '@/features/bookings/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatDayHeading, formatPkr, formatTimeRange } from '@/lib/format';
import { format } from 'date-fns';

const FILTERS: { label: string; value: BookingFilter }[] = [
  { label: 'All', value: undefined },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function BookingList() {
  const [status, setStatus] = useState<BookingFilter>(undefined);
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isFetching } = useMyBookings(status, page);

  function chooseFilter(value: BookingFilter) {
    setStatus(value);
    setPage(1); // a new filter always starts on its first page
  }

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Filter bookings" className="flex gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.label}
            variant={filter.value === status ? 'default' : 'outline'}
            size="sm"
            aria-pressed={filter.value === status}
            onClick={() => chooseFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isPending && <BookingListSkeleton />}

      {isError && (
        <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="text-destructive">{getErrorMessage(error, 'Could not load your bookings.')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && data.bookings.length === 0 && <EmptyBookings status={status} pageIsOutOfRange={page > 1} onFirstPage={() => setPage(1)} />}

      {data && data.bookings.length > 0 && (
        <ul className={isFetching ? 'divide-y border-y opacity-60 transition-opacity' : 'divide-y border-y transition-opacity'}>
          {data.bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </ul>
      )}

      {data && data.pagination.totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button variant="outline" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const cancel = useCancelBooking();
  const [confirming, setConfirming] = useState(false);

  const cancelled = booking.status === 'cancelled';
  // the API refuses to cancel a booking whose slot has started, so we do not offer the button
  const canCancel = !cancelled && new Date(booking.slot.startsAt) > new Date();
  const startsAt = new Date(booking.slot.startsAt);

  return (
    <li className="space-y-3 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className={cancelled ? 'text-lg font-medium text-muted-foreground' : 'text-lg font-medium'}>
          <Link href={`/venues/${booking.venue.id}`} className="underline-offset-4 hover:underline">
            {booking.venue.name}
          </Link>
        </h2>
        <span
          className={
            cancelled
              ? 'shrink-0 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground'
              : 'shrink-0 rounded-full border border-foreground px-2.5 py-0.5 text-xs font-medium'
          }
        >
          {cancelled ? 'Cancelled' : 'Confirmed'}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{booking.venue.city}</p>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className={cancelled ? 'text-muted-foreground' : undefined}>
          {formatDayHeading(startsAt)}, {formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)}
        </p>
        <p className={cancelled ? 'tabular-nums text-muted-foreground' : 'tabular-nums'}>{formatPkr(booking.pricePkr)}</p>
      </div>

      <p className="text-xs text-muted-foreground">
        {cancelled && booking.cancelledAt
          ? `Cancelled on ${format(new Date(booking.cancelledAt), 'd MMM yyyy, h:mm a')}`
          : `Booked on ${format(new Date(booking.createdAt), 'd MMM yyyy, h:mm a')}`}
      </p>

      {canCancel &&
        (confirming ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm cancellation">
            <span className="text-sm">Cancel this booking?</span>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(booking.id, { onSettled: () => setConfirming(false) })}
            >
              {cancel.isPending ? 'Cancelling…' : 'Yes, cancel it'}
            </Button>
            <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => setConfirming(false)}>
              Keep booking
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
            Cancel booking
          </Button>
        ))}
    </li>
  );
}

function EmptyBookings({
  status,
  pageIsOutOfRange,
  onFirstPage,
}: {
  status: BookingFilter;
  pageIsOutOfRange: boolean;
  onFirstPage: () => void;
}) {
  if (pageIsOutOfRange) {
    return (
      <div className="space-y-3 py-8">
        <p className="text-lg font-medium">There is nothing on this page.</p>
        <Button variant="outline" onClick={onFirstPage}>
          First page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-8">
      <p className="text-lg font-medium">
        {status ? `You have no ${status} bookings.` : 'You have not booked anything yet.'}
      </p>
      {!status && (
        <Link href="/venues" className={buttonVariants({ variant: 'outline' })}>
          Browse venues
        </Link>
      )}
    </div>
  );
}

function BookingListSkeleton() {
  return (
    <div role="status" aria-label="Loading bookings" className="divide-y border-y">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-2 py-5">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}