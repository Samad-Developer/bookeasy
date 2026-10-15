import type { Booking, BookingRow } from './booking.types.ts';

// The ONLY place that knows the booking column names (snake_case)
export const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  slotId: row.slot_id,
  status: row.status,
  pricePkr: row.price_pkr,
  createdAt: row.created_at,
  cancelledAt: row.cancelled_at,
  customer: { id: row.customer_id, name: row.customer_name },
  slot: { startsAt: row.starts_at, endsAt: row.ends_at },
  venue: { id: row.venue_id, name: row.venue_name, city: row.venue_city, ownerId: row.venue_owner_id },
});
