import { AppError } from '../../shared/errors/app-error.ts';
import type { AuthUser } from '../../shared/types/express.d.ts';
import type { CreateVenueInput, ListVenuesQuery, PaginationQuery, UpdateVenueInput } from './venue.schema.ts';
import * as repo from './venue.repository.ts';
import type { Venue, VenueRow } from './venue.types.ts';

const toVenue = (row: VenueRow): Venue => ({
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

const canManage = (user: AuthUser | undefined, venue: VenueRow) =>
  !!user && (user.role === 'admin' || venue.owner_id === user.id);

export async function createVenue(ownerId: number, input: CreateVenueInput) {
  return toVenue(await repo.insertVenue(ownerId, input));
}

// Public list: guests only ever see active venues
export async function listVenues(query: ListVenuesQuery) {
  const { rows, total } = await repo.findVenues(
    { city: query.city, category: query.category, onlyActive: true },
    query.page,
    query.limit,
  );
  return { items: rows.map(toVenue), total };
}

// The owner's own venues, including deactivated ones
export async function listMyVenues(ownerId: number, query: PaginationQuery) {
  const { rows, total } = await repo.findVenues({ ownerId, onlyActive: false }, query.page, query.limit);
  return { items: rows.map(toVenue), total };
}

export async function getVenue(id: number, viewer?: AuthUser) {
  const venue = await repo.findVenueById(id);
  // A deactivated venue is hidden from everyone except its owner and admins.
  // We answer 404 (not 403) so outsiders cannot tell that it exists.
  if (!venue || (!venue.is_active && !canManage(viewer, venue))) {
    throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
  }
  return toVenue(venue);
}

export async function updateVenue(id: number, user: AuthUser, changes: UpdateVenueInput) {
  const venue = await repo.findVenueById(id);
  if (!venue) throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
  if (!canManage(user, venue)) throw new AppError(403, 'NOT_VENUE_OWNER', 'You can only edit your own venues');

  const updated = await repo.updateVenueById(id, changes);
  return toVenue(updated);
}