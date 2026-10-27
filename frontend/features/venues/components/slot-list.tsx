'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { useCreateBooking } from '@/features/bookings/hooks';
import { SLOT_WINDOW_DAYS, SLOTS_LIMIT } from '@/features/venues/api';
import { useVenueSlots } from '@/features/venues/hooks';
import { groupSlotsByDay } from '@/features/venues/slot-utils';
import type { Slot } from '@/features/venues/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatDayHeading, formatPkr, formatTimeRange, relativeDayLabel } from '@/lib/format';

// This is a Client Component on purpose: availability changes all the time, and the Book button
// needs to know who is logged in. It loads in the browser with TanStack Query.
export function SlotList({ venueId }: { venueId: number }) {
  const [availableOnly, setAvailableOnly] = useState(false);
  const { data, isPending, isError, error, refetch, isFetching } = useVenueSlots(venueId, availableOnly);

  // ONE booking mutation for the whole list, so only one booking can be in flight at a time
  const booking = useCreateBooking(venueId);
  // which slot is waiting for "Yes, book it" (null = none)
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  // Group the flat list into days. useMemo = "only redo this when `data` changes".
  const days = useMemo(() => (data ? groupSlotsByDay(data.slots) : []), [data]);

  function book(slotId: number) {
    booking.mutate(slotId, { onSettled: () => setConfirmingId(null) });
  }

  return (
    <div className="space-y-6">
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={availableOnly}
          onChange={(event) => setAvailableOnly(event.target.checked)}
          className="size-4 accent-primary"
        />
        Show available slots only
      </label>

      {isPending && <SlotListSkeleton />}

      {isError && (
        <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="text-destructive">{getErrorMessage(error, 'Could not load the slots.')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && days.length === 0 && (
        <p className="text-muted-foreground">
          {availableOnly
            ? `No available slots in the next ${SLOT_WINDOW_DAYS} days.`
            : `No slots have been added for the next ${SLOT_WINDOW_DAYS} days.`}
        </p>
      )}

      {days.length > 0 && (
        <div className={isFetching ? 'space-y-8 opacity-60 transition-opacity' : 'space-y-8 transition-opacity'}>
          {days.map((day) => {
            const relative = relativeDayLabel(day.date);
            return (
              <section key={day.key} aria-labelledby={`day-${day.key}`}>
                <h3 id={`day-${day.key}`} className="mb-2 font-medium">
                  {formatDayHeading(day.date)}
                  {relative && <span className="ml-2 text-sm font-normal text-muted-foreground">{relative}</span>}
                </h3>

                <ul className="divide-y border-y">
                  {day.slots.map((slot) => (
                    <SlotRow
                      key={slot.id}
                      slot={slot}
                      venueId={venueId}
                      confirming={confirmingId === slot.id}
                      busy={booking.isPending}
                      onAskToBook={() => setConfirmingId(slot.id)}
                      onCancelAsk={() => setConfirmingId(null)}
                      onBook={() => book(slot.id)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {data && data.total > data.slots.length && (
        <p className="text-sm text-muted-foreground">
          Showing the first {SLOTS_LIMIT} of {data.total} slots in the next {SLOT_WINDOW_DAYS} days.
        </p>
      )}
    </div>
  );
}

function SlotRow({
  slot,
  venueId,
  confirming,
  busy,
  onAskToBook,
  onCancelAsk,
  onBook,
}: {
  slot: Slot;
  venueId: number;
  confirming: boolean;
  busy: boolean;
  onAskToBook: () => void;
  onCancelAsk: () => void;
  onBook: () => void;
}) {
  const { status, user } = useAuth();
  const muted = slot.isBooked ? 'text-muted-foreground' : '';

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-4">
        <span className={muted}>{formatTimeRange(slot.startsAt, slot.endsAt)}</span>

        <span className="flex items-center gap-4">
          <span className={`tabular-nums ${muted}`}>{formatPkr(slot.pricePkr)}</span>

          {slot.isBooked ? (
            <span className="w-24 text-right text-sm text-muted-foreground">Booked</span>
          ) : status === 'guest' ? (
            // a guest sees where to go: after login they come straight back to this venue
            <Link
              href={`/login?next=${encodeURIComponent(`/venues/${venueId}`)}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Log in to book
            </Link>
          ) : user?.role === 'customer' ? (
            !confirming && (
              <Button size="sm" disabled={busy} onClick={onAskToBook} aria-label={`Book ${formatTimeRange(slot.startsAt, slot.endsAt)}`}>
                Book
              </Button>
            )
          ) : (
            // owners, admins (and the moment while we still ask the API who is logged in)
            <span className="w-24 text-right text-sm font-medium">Available</span>
          )}
        </span>
      </div>

      {confirming && (
        <div role="group" aria-label="Confirm booking" className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <span className="text-sm">
            Book this slot for {formatPkr(slot.pricePkr)}?
          </span>
          <Button size="sm" disabled={busy} onClick={onBook}>
            {busy ? 'Booking…' : 'Yes, book it'}
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={onCancelAsk}>
            Not now
          </Button>
        </div>
      )}
    </li>
  );
}

function SlotListSkeleton() {
  return (
    <div role="status" aria-label="Loading slots" className="space-y-3">
      <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-10 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}