import type { Metadata } from 'next';
import { VenueBookingsSection } from '@/features/owner/components/venue-sections';

export const metadata: Metadata = { title: 'Venue bookings | BookEasy' };

export default function VenueBookingsPage() {
  return <VenueBookingsSection />;
}