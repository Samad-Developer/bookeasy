import Link from 'next/link';
import { connection } from 'next/server';
import { listVenues } from '@/features/venues/api';
import { VenueList } from '@/features/venues/components/venue-list';
import { EMPTY_SEARCH } from '@/features/venues/search-params';
import type { Venue } from '@/features/venues/types';

// A Server Component: it fetches on the server, so the venues are already in the HTML the browser receives.
export async function FeaturedVenues() {
  // "Run this when a visitor asks, not once while building the site."
  // Without this line the home page could be built once and show the same venues until the next deploy.
  await connection();

  let venues: Venue[];

  try {
    ({ venues } = await listVenues(EMPTY_SEARCH, 4));
  } catch {
    return null; // if the API is down the home page still works, it just shows no venues
  }

  if (venues.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="mt-16 space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="featured-heading" className="text-xl font-semibold tracking-tight">
          Newly listed
        </h2>
        <Link href="/venues" className="text-sm underline underline-offset-4">
          See all venues
        </Link>
      </div>
      <VenueList venues={venues} />
    </section>
  );
}