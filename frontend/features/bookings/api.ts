import { api } from '@/lib/api-client';
import type { Booking, BookingFilter } from '@/features/bookings/types';

// One function per backend endpoint (same idea as features/venues/api.ts).

export const BOOKINGS_PER_PAGE = 10;

// POST /bookings   (customers only)
export async function createBooking(slotId: number) {
  const response = await api.post<Booking>('/bookings', { slotId });
  return response.data;
}

// GET /bookings/mine?status=&page=&limit=   (newest booking first)
export async function listMyBookings(options: { status: BookingFilter; page: number }) {
  const response = await api.get<Booking[]>('/bookings/mine', {
    query: { status: options.status, page: options.page, limit: BOOKINGS_PER_PAGE },
  });

  const pagination = response.meta.pagination ?? {
    page: options.page,
    limit: BOOKINGS_PER_PAGE,
    total: response.data.length,
    totalPages: 1,
  };

  return { bookings: response.data, pagination };
}

// POST /bookings/:id/cancel
export async function cancelBooking(id: number) {
  const response = await api.post<Booking>(`/bookings/${id}/cancel`);
  return response.data;
}