import type { Metadata } from 'next';
import { VenueForm } from '@/features/owner/components/venue-form';

export const metadata: Metadata = { title: 'Add a venue | BookEasy' };

export default function NewVenuePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Add a venue</h1>
      <VenueForm />
    </div>
  );
}