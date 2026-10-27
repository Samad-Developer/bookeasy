import type { Metadata } from 'next';
import { VenueSlotsSection } from '@/features/owner/components/venue-sections';

export const metadata: Metadata = { title: 'Venue slots | BookEasy' };

export default function VenueSlotsPage() {
  return <VenueSlotsSection />;
}