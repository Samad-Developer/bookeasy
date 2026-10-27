import type { Metadata } from 'next';
import { AdminVenues } from '@/features/admin/components/admin-venues';

export const metadata: Metadata = { title: 'All venues | BookEasy' };

export default function AdminVenuesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Venues</h1>
      <AdminVenues />
    </div>
  );
}