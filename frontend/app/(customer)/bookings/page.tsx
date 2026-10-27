import type { Metadata } from 'next';
import { BookingList } from '@/features/bookings/components/booking-list';

export const metadata: Metadata = { title: 'My bookings | BookEasy' };

// Only customers get here (the layout wraps this page in <RoleGuard>).
// The list loads in the browser because the login token lives in browser memory.
export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">My bookings</h1>
      <BookingList />
    </div>
  );
}