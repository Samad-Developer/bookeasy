import type { Venue, VenueRow } from "./venue.types.ts";

export const toVenue = (row: VenueRow): Venue => ({
  id: row.id,
  ownerId: row.owner_id,
  name: row.name,
  description: row.description,
  category: row.category,
  city: row.city,
  address: row.address,
  capacity: row.capacity,
  isActive: row.is_active,
  createdAt: row.created_at,
});
