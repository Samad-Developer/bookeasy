import { api } from '@/lib/api-client';
import type { Booking, BookingFilter } from '@/features/bookings/types';
import type { OwnerStats } from '@/features/owner/types';
import type { Slot, Venue } from '@/features/venues/types';

// One function per owner endpoint. No React in this file.

export const OWNER_VENUES_PER_PAGE = 10;
export const MANAGED_SLOTS_PER_PAGE = 20;
export const VENUE_BOOKINGS_PER_PAGE = 10;

export type VenueInput = {
  name: string;
  category: string;
  city: string;
  address: string;
  capacity: number;
  description: string;
};

export type SlotInput = { startsAt: string; endsAt: string; pricePkr: number };

// Same fallback for every list: if the API sends no pagination info, pretend there is one page
function pageInfo(meta: { pagination?: { page: number; limit: number; total: number; totalPages: number } }, page: number, limit: number, count: number) {
  return meta.pagination ?? { page, limit, total: count, totalPages: 1 };
}

// GET /stats/owner
export async function getOwnerStats() {
  const response = await api.get<OwnerStats>('/stats/owner');
  return response.data;
}

// GET /venues/mine   (includes hidden venues; newest first)
export async function listMyVenues(page: number) {
  const response = await api.get<Venue[]>('/venues/mine', { query: { page, limit: OWNER_VENUES_PER_PAGE } });
  return { venues: response.data, pagination: pageInfo(response.meta, page, OWNER_VENUES_PER_PAGE, response.data.length) };
}

// POST /venues
export async function createVenue(input: VenueInput) {
  const response = await api.post<Venue>('/venues', input);
  return response.data;
}

// PATCH /venues/:id   (send only what changes)
export async function updateVenue(id: number, changes: Partial<VenueInput> & { isActive?: boolean }) {
  const response = await api.patch<Venue>(`/venues/${id}`, changes);
  return response.data;
}

// GET /venues/:id/slots   (the API starts from "now", so these are the upcoming slots)
export async function listManagedSlots(venueId: number, page: number) {
  const response = await api.get<Slot[]>(`/venues/${venueId}/slots`, { query: { page, limit: MANAGED_SLOTS_PER_PAGE } });
  return { slots: response.data, pagination: pageInfo(response.meta, page, MANAGED_SLOTS_PER_PAGE, response.data.length) };
}

// POST /venues/:id/slots
export async function createSlot(venueId: number, input: SlotInput) {
  const response = await api.post<Slot>(`/venues/${venueId}/slots`, input);
  return response.data;
}

// PATCH /slots/:id   (a booked slot can only change its price)
export async function updateSlotPrice(slotId: number, pricePkr: number) {
  const response = await api.patch<Slot>(`/slots/${slotId}`, { pricePkr });
  return response.data;
}

// DELETE /slots/:id
export async function deleteSlot(slotId: number) {
  await api.delete<null>(`/slots/${slotId}`);
}

// GET /venues/:id/bookings   (owner of the venue or admin)
export async function listVenueBookings(venueId: number, options: { status: BookingFilter; page: number }) {
  const response = await api.get<Booking[]>(`/venues/${venueId}/bookings`, {
    query: { status: options.status, page: options.page, limit: VENUE_BOOKINGS_PER_PAGE },
  });
  return {
    bookings: response.data,
    pagination: pageInfo(response.meta, options.page, VENUE_BOOKINGS_PER_PAGE, response.data.length),
  };
}