import { DatabaseError } from 'pg';
import { AppError } from '../../shared/errors/app-error.ts';
import type { AuthUser } from '../../shared/types/express.d.ts';
import * as slotRepo from '../slots/slot.repository.ts';
import * as venueRepo from '../venues/venue.repository.ts';
import { canManage } from '../venues/venue.service.ts';
import * as repo from './booking.repository.ts';
import type { ListBookingsQuery } from './booking.schema.ts';
import type { Booking } from './booking.types.ts';

// The database unique index is the real guarantee against double booking.
// We only translate its error into a clear answer.
function rethrowAlreadyBooked(error: unknown): never {
  if (error instanceof DatabaseError && error.code === '23505') {
    throw new AppError(409, 'SLOT_ALREADY_BOOKED', 'This slot has just been booked by someone else');
  }
  throw error;
}

export async function createBooking(customerId: number, slotId: number) {
  const slot = await slotRepo.findSlotById(slotId);
  const venue = slot && (await venueRepo.findVenueById(slot.venueId));
  // A slot of a deactivated venue looks the same as a missing slot
  if (!slot || !venue || !venue.isActive) throw new AppError(404, 'SLOT_NOT_FOUND', 'Slot not found');

  if (slot.startsAt <= new Date()) {
    throw new AppError(422, 'SLOT_ALREADY_STARTED', 'This slot has already started');
  }

  try {
    const booking = await repo.insertBooking(slotId, customerId);
    if (!booking) throw new AppError(404, 'SLOT_NOT_FOUND', 'Slot not found'); // slot deleted a moment ago
    return booking;
  } catch (error) {
    rethrowAlreadyBooked(error);
  }
}

export async function listMyBookings(customerId: number, query: ListBookingsQuery) {
  const { bookings, total } = await repo.findBookings({ customerId, status: query.status }, query.page, query.limit);
  return { items: bookings, total };
}

export async function listVenueBookings(venueId: number, user: AuthUser, query: ListBookingsQuery) {
  const venue = await venueRepo.findVenueById(venueId);
  if (!venue) throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
  if (!canManage(user, venue)) throw new AppError(403, 'NOT_VENUE_OWNER', 'You can only see bookings of your own venues');

  const { bookings, total } = await repo.findBookings({ venueId, status: query.status }, query.page, query.limit);
  return { items: bookings, total };
}

// Who may see or cancel a booking: the customer who made it, the owner of its venue, or an admin.
// Everyone else gets 404, so booking ids cannot be probed.
async function loadAccessibleBooking(id: number, user: AuthUser): Promise<Booking> {
  const booking = await repo.findBookingById(id);
  const allowed =
    booking && (user.role === 'admin' || booking.customer.id === user.id || booking.venue.ownerId === user.id);
  if (!booking || !allowed) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  return booking;
}

export async function getBooking(id: number, user: AuthUser) {
  return loadAccessibleBooking(id, user);
}

export async function cancelBooking(id: number, user: AuthUser) {
  const booking = await loadAccessibleBooking(id, user);

  if (booking.status === 'cancelled') {
    throw new AppError(409, 'BOOKING_ALREADY_CANCELLED', 'This booking is already cancelled');
  }
  if (booking.slot.startsAt <= new Date()) {
    throw new AppError(422, 'BOOKING_ALREADY_STARTED', 'A booking cannot be cancelled after its slot has started');
  }

  const cancelled = await repo.cancelBookingById(id);
  // Zero rows updated means someone cancelled it between our check and our update
  if (!cancelled) throw new AppError(409, 'BOOKING_ALREADY_CANCELLED', 'This booking is already cancelled');
  return cancelled;
}
