'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PageButtons } from '@/components/shared/page-buttons';
import { VenuePhoto } from '@/components/shared/venue-photo';
import { Button, buttonVariants } from '@/components/ui/button';
import { useMyVenues } from '@/features/owner/hooks';
import { categoryLabel } from '@/features/venues/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatCount } from '@/lib/format';

export function MyVenues() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isFetching } = useMyVenues(page);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading your venues" className="divide-y border-y">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-2 py-5">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p className="text-destructive">{getErrorMessage(error, 'Could not load your venues.')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (data.venues.length === 0) {
    return page > 1 ? (
      <div className="space-y-3 py-8">
        <p className="text-lg font-medium">There is nothing on this page.</p>
        <Button variant="outline" onClick={() => setPage(1)}>
          First page
        </Button>
      </div>
    ) : (
      <div className="space-y-3 py-8">
        <p className="text-lg font-medium">You have not listed a venue yet.</p>
        <Link href="/owner/venues/new" className={buttonVariants()}>
          Add a venue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className={isFetching ? 'divide-y border-y opacity-60 transition-opacity' : 'divide-y border-y transition-opacity'}>
        {data.venues.map((venue) => (
          <li key={venue.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
            <div className="flex min-w-0 items-center gap-4">
              <VenuePhoto src={venue.coverThumbUrl} alt="" className="aspect-[4/3] w-20 shrink-0 sm:w-28" />
              <div className="min-w-0 space-y-1">
                <h2 className="flex flex-wrap items-center gap-2 text-lg font-medium">
                  <Link href={`/owner/venues/${venue.id}/slots`} className="underline-offset-4 hover:underline">
                    {venue.name}
                  </Link>
                  {!venue.isActive && (
                    <span className="rounded-full border px-2.5 py-0.5 text-xs font-normal text-muted-foreground">Hidden</span>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {categoryLabel(venue.category)} in {venue.city} · Capacity {formatCount(venue.capacity)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/owner/venues/${venue.id}/slots`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Slots
              </Link>
              <Link href={`/owner/venues/${venue.id}/bookings`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Bookings
              </Link>
              <Link href={`/owner/venues/${venue.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <PageButtons page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
    </div>
  );
}