import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Pagination } from '@/components/shared/pagination';
import { buttonVariants } from '@/components/ui/button';
import { listVenues } from '@/features/venues/api';
import { VenueFilters } from '@/features/venues/components/venue-filters';
import { VenueList, VenueListSkeleton } from '@/features/venues/components/venue-list';
import { hasActiveFilters, parseVenueSearch, type RawSearchParams } from '@/features/venues/search-params';
import { buildHref } from '@/lib/urls';

export const metadata: Metadata = { title: 'Venues | BookEasy' };

// The page itself does not read the URL. Only <VenuesContent> does, inside <Suspense>,
// so the heading shows instantly and the venues stream in when the API answers.
export default function VenuesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Venues</h1>
      <Suspense fallback={<VenueListSkeleton />}>
        <VenuesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function VenuesContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const search = parseVenueSearch(await searchParams);
  const { venues, pagination } = await listVenues(search);
console.log('checking venues', venues)
  const filtersActive = hasActiveFilters(search);
  const filterParams = { q: search.q, city: search.city, category: search.category };
  const pageIsOutOfRange = pagination.total > 0 && venues.length === 0; // for example /venues?page=99

  return (
    <>
      <VenueFilters search={search} />

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {pagination.total === 0
          ? 'No venues found'
          : `${pagination.total} ${pagination.total === 1 ? 'venue' : 'venues'}${filtersActive ? ' match your search' : ''}`}
      </p>

      {venues.length > 0 ? (
        <VenueList venues={venues} />
      ) : pageIsOutOfRange ? (
        <EmptyState
          title="There is nothing on this page."
          text="Go back to the first page to see the results."
          href={buildHref('/venues', filterParams)}
          action="First page"
        />
      ) : filtersActive ? (
        <EmptyState
          title="No venues match your search."
          text="Try a different word or city, or clear the filters."
          href="/venues"
          action="Clear filters"
        />
      ) : (
        <p className="py-8 text-lg font-medium">No venues have been listed yet.</p>
      )}

      <Pagination page={pagination.page} totalPages={pagination.totalPages} basePath="/venues" params={filterParams} />
    </>
  );
}

function EmptyState({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <div className="space-y-3 py-8">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-muted-foreground">{text}</p>
      <Link href={href} className={buttonVariants({ variant: 'outline' })}>
        {action}
      </Link>
    </div>
  );
}