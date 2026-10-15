import { AppError } from '../../shared/errors/app-error.ts';
import type { AuthUser } from '../../shared/types/express.d.ts';
import type { CreateVenueInput, ListVenuesQuery, PaginationQuery, UpdateVenueInput } from './venue.schema.ts';
import * as repo from './venue.repository.ts';
import type { Venue } from './venue.types.ts';

export const canManage = (user: AuthUser | undefined, venue: Venue) =>
  !!user && (user.role === 'admin' || venue.ownerId === user.id);

export async function createVenue(ownerId: number, input: CreateVenueInput) {
  return repo.insertVenue(ownerId, input);
}

// Public list: guests only ever see active venues
export async function listVenues(query: ListVenuesQuery) {
  const { venues, total } = await repo.findVenues(
    { city: query.city, category: query.category, search: query.q, onlyActive: true },
    query.page,
    query.limit,
  );
  return { items: venues, total };
}

// The owner's own venues, including deactivated ones
export async function listMyVenues(ownerId: number, query: PaginationQuery) {
  const { venues, total } = await repo.findVenues({ ownerId, onlyActive: false }, query.page, query.limit);
  return { items: venues, total };
}

export async function getVenue(id: number, viewer?: AuthUser) {
  const venue = await repo.findVenueById(id);
  // A deactivated venue is hidden from everyone except its owner and admins.
  // We answer 404 (not 403) so outsiders cannot tell that it exists.
  if (!venue || (!venue.isActive && !canManage(viewer, venue))) {
    throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
  }
  return venue;
}

export async function updateVenue(id: number, user: AuthUser, changes: UpdateVenueInput) {
  const venue = await repo.findVenueById(id);
  if (!venue) throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
  if (!canManage(user, venue)) throw new AppError(403, 'NOT_VENUE_OWNER', 'You can only edit your own venues');

  return repo.updateVenueById(id, changes);
}