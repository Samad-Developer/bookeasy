import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getVenue } from '@/features/venues/api';
import { SlotList } from '@/features/venues/components/slot-list';
import { VenueGallery } from '@/features/venues/components/vanue-gallery';
import { categoryLabel, type VenueDetail } from '@/features/venues/types';
import { ApiError } from '@/lib/api-client';
import { formatCount } from '@/lib/format';

// Same idea as the list page: the page is instant, the part that reads the URL (params) is inside <Suspense>.
export default function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="space-y-8">
      <Link href="/venues" className="inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">
        All venues
      </Link>
      <Suspense fallback={<VenueDetailSkeleton />}>
        <VenueDetail params={params} />
      </Suspense>
    </div>
  );
}

async function VenueDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // /venues/abc or /venues/99999999999 can never be a real venue: show the 404 page without asking the API
  const venueId = Number(id);
  if (!/^\d+$/.test(id) || venueId < 1 || venueId > 2_147_483_647) notFound();

  let venue: VenueDetail;
  try {
    venue = await getVenue(venueId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound(); // the API said: no such venue
    throw error; // anything else (API down...) goes to error.tsx
  }

  return (
    <>
      {/* React 19 moves a <title> found anywhere in the page into <head> */}
      <title>{`${venue.name} | BookEasy`}</title>

      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{venue.name}</h1>

        <VenueGallery images={venue.images} name={venue.name} />

        <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd>{categoryLabel(venue.category)}</dd>
          <dt className="text-muted-foreground">City</dt>
          <dd>{venue.city}</dd>
          <dt className="text-muted-foreground">Address</dt>
          <dd>{venue.address}</dd>
          <dt className="text-muted-foreground">Capacity</dt>
          <dd>{formatCount(venue.capacity)} guests</dd>
        </dl>

        {venue.description && <p className="max-w-prose whitespace-pre-line">{venue.description}</p>}
      </header>

      <section aria-labelledby="availability-heading" className="space-y-4">
        <h2 id="availability-heading" className="text-xl font-semibold tracking-tight">
          Availability
        </h2>
        <SlotList venueId={venue.id} />
      </section>
    </>
  );
}

function VenueDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading venue" className="space-y-4">
      <div className="h-9 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
      <div className="h-20 max-w-prose animate-pulse rounded bg-muted" />
    </div>
  );
}