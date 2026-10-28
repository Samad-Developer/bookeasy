'use client';

import { useManagedVenueContext } from '@/features/owner/components/venue-shell';
import { VenueForm } from '@/features/owner/components/venue-form';
import { VenuePhotos } from '@/features/owner/components/venue-photos';

// The "Details" tab: the photos, then the same form as "Add a venue" filled with the saved values
export function VenueDetailsEditor() {
  const venue = useManagedVenueContext();

  return (
    <div className="space-y-12">
      <VenuePhotos venue={venue} />
      <section aria-labelledby="details-heading" className="space-y-4">
        <h2 id="details-heading" className="text-xl font-semibold tracking-tight">
          Details
        </h2>
        {/* key = the form starts fresh if the venue changes */}
        <VenueForm key={venue.id} venue={venue} />
      </section>
    </div>
  );
}