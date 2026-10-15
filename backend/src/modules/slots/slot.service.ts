import { DatabaseError } from 'pg';
import { AppError } from '../../shared/errors/app-error.ts';
import type { AuthUser } from '../../shared/types/express.ts';
import * as venueRepo from '../venues/venue.repository.ts';
import { canManage, getVenue } from '../venues/venue.service.ts';
import * as repo from './slot.repository.ts';
import type { CreateSlotInput, ListSlotsQuery, UpdateSlotInput } from './slot.schema.ts';

const MAX_SLOT_HOURS = 24;

// Business rules about a time range. Shape (ISO format) was already checked by Zod.
function assertValidRange(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) {
    throw new AppError(400, 'INVALID_TIME_RANGE', 'endsAt must be after startsAt', [
      { field: 'endsAt', issue: 'endsAt must be after startsAt' },
    ]);
  }
  if ((endsAt.getTime() - startsAt.getTime()) / 3_600_000 > MAX_SLOT_HOURS) {
    throw new AppError(400, 'INVALID_TIME_RANGE', `A slot can be at most ${MAX_SLOT_HOURS} hours long`, [
      { field: 'endsAt', issue: `A slot can be at most ${MAX_SLOT_HOURS} hours long` },
    ]);
  }
  if (startsAt <= new Date()) {
    throw new AppError(422, 'SLOT_IN_PAST', 'A slot must start in the future', [
      { field: 'startsAt', issue: 'A slot must start in the future' },
    ]);
  }
}

// The database exclusion constraint is the real guarantee. We only translate its error.
function rethrowOverlap(error: unknown): never {
  if (error instanceof DatabaseError && error.code === '23P01') {
    throw new AppError(409, 'SLOT_OVERLAP', 'This time range overlaps another slot of the same venue');
  }
  throw error;
}

// Loads a slot and its venue, then checks the user may manage it
async function loadManagedSlot(slotId: number, user: AuthUser) {
  const slot = await repo.findSlotById(slotId);
  const venue = slot && (await venueRepo.findVenueById(slot.venueId));
  if (!slot || !venue) throw new AppError(404, 'SLOT_NOT_FOUND', 'Slot not found');
  if (!canManage(user, venue)) throw new AppError(403, 'NOT_VENUE_OWNER', 'You can only manage slots of your own venues');
  return slot;
}

export async function listSlots(venueId: number, query: ListSlotsQuery, viewer?: AuthUser) {
  await getVenue(venueId, viewer); // 404 for missing or hidden venues
  const from = query.from ?? new Date().toISOString();
  const { slots, total } = await repo.findSlotsByVenue(venueId, { from, to: query.to, onlyAvailable: query.available }, query.page, query.limit);
  return { items: slots, total };
}

export async function createSlot(venueId: number, user: AuthUser, input: CreateSlotInput) {
  const venue = await venueRepo.findVenueById(venueId);
  if (!venue) throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
  if (!canManage(user, venue)) throw new AppError(403, 'NOT_VENUE_OWNER', 'You can only add slots to your own venues');

  assertValidRange(new Date(input.startsAt), new Date(input.endsAt));

  try {
    return await repo.insertSlot(venueId, input);
  } catch (error) {
    rethrowOverlap(error);
  }
}

export async function updateSlot(slotId: number, user: AuthUser, changes: UpdateSlotInput) {
  const slot = await loadManagedSlot(slotId, user);

  const timesChanged = changes.startsAt !== undefined || changes.endsAt !== undefined;
  if (timesChanged) {
    // Combine what is stored with what was sent, then check the FINAL range
    assertValidRange(
      changes.startsAt ? new Date(changes.startsAt) : slot.startsAt,
      changes.endsAt ? new Date(changes.endsAt) : slot.endsAt,
    );
  }

  try {
    const updated = await repo.updateSlotById(slotId, changes, timesChanged);
    if (!updated) {
      throw new AppError(409, 'SLOT_HAS_BOOKING', 'A booked slot cannot be moved. Only its price can change');
    }
    return updated;
  } catch (error) {
    rethrowOverlap(error);
  }
}

export async function deleteSlot(slotId: number, user: AuthUser) {
  await loadManagedSlot(slotId, user);
  const deleted = await repo.deleteSlotById(slotId);
  if (!deleted) {
    throw new AppError(409, 'SLOT_HAS_BOOKING', 'A slot that has bookings cannot be deleted');
  }
}
