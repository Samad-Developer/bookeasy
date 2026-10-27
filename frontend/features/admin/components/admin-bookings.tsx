'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { PageButtons } from '@/components/shared/page-buttons';
import { Button } from '@/components/ui/button';
import { useAllBookings } from '@/features/admin/hooks';
import { useCancelBooking } from '@/features/bookings/hooks';
import type { Booking, BookingFilter } from '@/features/bookings/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatCount, formatDayHeading, formatPkr, formatTimeRange } from '@/lib/format';

const FILTERS: { label: string; value: BookingFilter }[] = [
  { label: 'All', value: undefined },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
];

// Every booking on the platform, newest first
export function AdminBookings() {
  const [status, setStatus] = useState<BookingFilter>(undefined);
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isFetching } = useAllBookings(status, page);

  function chooseFilter(value: BookingFilter) {
    setStatus(value);
    setPage(1);
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

      {isPending && (
        <div role="status" aria-label="Loading bookings" className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-20 animate-pulse rounded bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="text-destructive">{getErrorMessage(error, 'Could not load the bookings.')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && data.bookings.length === 0 && (
        <p className="py-4 text-lg font-medium">
          {page > 1 ? 'There is nothing on this page.' : status ? `No ${status} bookings.` : 'There are no bookings yet.'}
        </p>
      )}

      {data && data.bookings.length > 0 && (
        <>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {formatCount(data.pagination.total)} {data.pagination.total === 1 ? 'booking' : 'bookings'}
          </p>
          <ul className={isFetching ? 'divide-y border-y opacity-60 transition-opacity' : 'divide-y border-y transition-opacity'}>
            {data.bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </ul>
        </>
      )}

      {data && <PageButtons page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const cancel = useCancelBooking();
  const [confirming, setConfirming] = useState(false);

  const cancelled = booking.status === 'cancelled';
  const canCancel = !cancelled && new Date(booking.slot.startsAt) > new Date();
  const muted = cancelled ? 'text-muted-foreground' : '';

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className={`font-medium ${muted}`}>
          {booking.venue.name} <span className="text-sm font-normal text-muted-foreground">· {booking.venue.city}</span>
        </p>
        <span
          className={
            cancelled
              ? 'rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground'
              : 'rounded-full border border-foreground px-2.5 py-0.5 text-xs font-medium'
          }
        >
          {cancelled ? 'Cancelled' : 'Confirmed'}
        </span>
      </div>

      <p className={`text-sm ${muted || 'text-muted-foreground'}`}>Booked by {booking.customer.name}</p>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className={muted}>
          {formatDayHeading(new Date(booking.slot.startsAt))}, {formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)}
        </p>
        <p className={`tabular-nums ${muted}`}>{formatPkr(booking.pricePkr)}</p>
      </div>

      <p className="text-xs text-muted-foreground">
        {cancelled && booking.cancelledAt
          ? `Cancelled on ${format(new Date(booking.cancelledAt), 'd MMM yyyy, h:mm a')}`
          : `Booked on ${format(new Date(booking.createdAt), 'd MMM yyyy, h:mm a')}`}
      </p>

      {canCancel &&
        (confirming ? (
          <div role="group" aria-label="Confirm cancellation" className="flex flex-wrap items-center gap-2">
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