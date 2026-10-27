import type { Metadata } from 'next';
import { VenueDetailsEditor } from '@/features/owner/components/venue-details-editor';

export const metadata: Metadata = { title: 'Venue details | BookEasy' };

export default function VenueDetailsPage() {
  return <VenueDetailsEditor />;
}