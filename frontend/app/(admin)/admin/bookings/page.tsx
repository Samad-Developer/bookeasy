import type { Metadata } from 'next';
import { AdminBookings } from '@/features/admin/components/admin-bookings';

export const metadata: Metadata = { title: 'All bookings | BookEasy' };

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Bookings</h1>
      <AdminBookings />
    </div>
  );
}