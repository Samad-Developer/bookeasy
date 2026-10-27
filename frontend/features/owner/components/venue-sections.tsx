'use client';

import { useManagedVenueContext } from '@/features/owner/components/venue-shell';
import { SlotManager } from '@/features/owner/components/slot-manager';
import { VenueBookings } from '@/features/owner/components/venue-bookings';

// Small client wrappers: the pages are Server Components, they cannot read the venue from context themselves.

export function VenueSlotsSection() {
  const venue = useManagedVenueContext();
  return <SlotManager venueId={venue.id} />;
}

export function VenueBookingsSection() {
  const venue = useManagedVenueContext();
  return <VenueBookings venueId={venue.id} />;
}