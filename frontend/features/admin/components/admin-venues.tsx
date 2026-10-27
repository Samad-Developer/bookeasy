'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { PageButtons } from '@/components/shared/page-buttons';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAllVenues, useSetVenueActive } from '@/features/admin/hooks';
import type { VenueFilters } from '@/features/admin/types';
import { categoryLabel, VENUE_CATEGORIES, type Venue } from '@/features/venues/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatCount } from '@/lib/format';

const selectClass = 'h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

const NO_FILTERS: VenueFilters = { q: '', category: undefined, isActive: undefined };

// Every venue on the platform, including the ones owners have hidden
export function AdminVenues() {
  const [filters, setFilters] = useState<VenueFilters>(NO_FILTERS);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isFetching } = useAllVenues(filters, page);

  function changeFilters(changes: Partial<VenueFilters>) {
    setFilters((current) => ({ ...current, ...changes }));
    setPage(1);
  }

  function search(event: FormEvent) {
    event.preventDefault();
    changeFilters({ q: searchText.trim() });
  }

  const filtersActive = !!(filters.q || filters.category || filters.isActive !== undefined);

  return (
    <div className="space-y-6">
      <form onSubmit={search} role="search" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="venue-q">Search</Label>
          <Input id="venue-q" type="search" placeholder="Venue name or description" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venue-category">Type</Label>
          <select
            id="venue-category"
            className={selectClass}
            value={filters.category ?? ''}
            onChange={(event) => changeFilters({ category: event.target.value || undefined })}
          >
            <option value="">All types</option>
            {VENUE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venue-status">Visibility</Label>
          <select
            id="venue-status"
            className={selectClass}
            value={filters.isActive === undefined ? '' : String(filters.isActive)}
            onChange={(event) => changeFilters({ isActive: event.target.value === '' ? undefined : event.target.value === 'true' })}
          >
            <option value="">Visible and hidden</option>
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Search</Button>
          {filtersActive && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchText('');
                changeFilters(NO_FILTERS);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {isPending && (
        <div role="status" aria-label="Loading venues" className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="text-destructive">{getErrorMessage(error, 'Could not load the venues.')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {data.pagination.total === 0
            ? 'No venues found'
            : `${formatCount(data.pagination.total)} ${data.pagination.total === 1 ? 'venue' : 'venues'}${filtersActive ? ' match your search' : ''}`}
        </p>
      )}

      {data && data.venues.length > 0 && (
        <ul className={isFetching ? 'divide-y border-y opacity-60 transition-opacity' : 'divide-y border-y transition-opacity'}>
          {data.venues.map((venue) => (
            <VenueRow key={venue.id} venue={venue} />
          ))}
        </ul>
      )}

      {data && data.venues.length === 0 && page > 1 && (
        <Button variant="outline" onClick={() => setPage(1)}>
          First page
        </Button>
      )}

      {data && <PageButtons page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}

function VenueRow({ venue }: { venue: Venue }) {
  const setActive = useSetVenueActive();
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="flex flex-wrap items-center gap-2 text-lg font-medium">
          {venue.name}
          {!venue.isActive && <span className="rounded-full border px-2.5 py-0.5 text-xs font-normal text-muted-foreground">Hidden</span>}
        </h2>
        <span className="text-sm text-muted-foreground">Owner #{venue.ownerId}</span>
      </div>

      <p className="text-sm text-muted-foreground">
        {categoryLabel(venue.category)} in {venue.city} · Capacity {formatCount(venue.capacity)}
      </p>

      {confirming ? (
        <div role="group" aria-label="Confirm visibility change" className="flex flex-wrap items-center gap-2">
          <span className="text-sm">{venue.isActive ? `Hide ${venue.name} from customers?` : `Show ${venue.name} to customers again?`}</span>
          <Button
            variant={venue.isActive ? 'destructive' : 'default'}
            size="sm"
            disabled={setActive.isPending}
            onClick={() => setActive.mutate({ id: venue.id, isActive: !venue.isActive }, { onSettled: () => setConfirming(false) })}
          >
            {setActive.isPending ? 'Saving…' : venue.isActive ? 'Yes, hide it' : 'Yes, show it'}
          </Button>
          <Button variant="outline" size="sm" disabled={setActive.isPending} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {/* the public page answers 404 for hidden venues, so we only link visible ones */}
          {venue.isActive && (
            <Link href={`/venues/${venue.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              View public page
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
            {venue.isActive ? 'Hide' : 'Show'}
          </Button>
        </div>
      )}
    </li>
  );
}