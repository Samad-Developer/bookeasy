'use client';

import { useManagedVenueContext } from '@/features/owner/components/venue-shell';
import { VenueForm } from '@/features/owner/components/venue-form';

// The "Details" tab: the same form as "Add a venue", filled with the saved values
export function VenueDetailsEditor() {
  const venue = useManagedVenueContext();
  // key = the form starts fresh if the venue changes
  return <VenueForm key={venue.id} venue={venue} />;
}