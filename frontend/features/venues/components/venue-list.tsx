import Link from 'next/link';
import { VenuePhoto } from '@/components/shared/venue-photo';
import { categoryLabel, type Venue } from '@/features/venues/types';
import { formatCount } from '@/lib/format';

// A plain list with dividers (not a grid of cards): every row is one venue and the whole row is a link.
export function VenueList({ venues }: { venues: Venue[] }) {
  return (
    <ul className="divide-y border-y">
      {venues.map((venue) => (
        <li key={venue.id}>
          <Link href={`/venues/${venue.id}`} className="group flex gap-4 py-5">
            {/* alt="" because the venue name right next to it already says what this is */}
            <VenuePhoto src={venue.coverThumbUrl} alt="" className="aspect-[4/3] w-28 shrink-0 sm:w-40" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-medium underline-offset-4 group-hover:underline group-focus-visible:underline">
                  {venue.name}
                </h2>
                <span className="shrink-0 text-sm text-muted-foreground">Capacity {formatCount(venue.capacity)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {categoryLabel(venue.category)} in {venue.city}
              </p>
              {venue.description && <p className="mt-2 line-clamp-2 max-w-prose text-sm">{venue.description}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Shown while the server is still fetching
export function VenueListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading venues" className="divide-y border-y">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex gap-4 py-5">
          <div className="aspect-[4/3] w-28 shrink-0 animate-pulse rounded bg-muted sm:w-40" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}