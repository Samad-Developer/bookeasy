import type { Slot, SlotRow } from './slot.types.ts';

// The ONLY place that knows the slot column names (snake_case)
export const toSlot = (row: SlotRow): Slot => ({
  id: row.id,
  venueId: row.venue_id,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  pricePkr: row.price_pkr,
  createdAt: row.created_at,
  isBooked: row.is_booked,
});
