import type { ReactNode } from 'react';
import { VenueShell } from '@/features/owner/components/venue-shell';

// Wraps /owner/venues/[id], /slots and /bookings: loads the venue once and shows the name and tabs
export default function ManageVenueLayout({ children }: { children: ReactNode }) {
  return <VenueShell>{children}</VenueShell>;
}