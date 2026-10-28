import { addDays } from 'date-fns';
import { api } from '@/lib/api-client';
import type { VenueSearch } from '@/features/venues/search-params';
import type { Slot, Venue, VenueDetail } from '@/features/venues/types';

// One function per backend endpoint. No React in this file, so it works in Server AND Client Components.

export const VENUES_PER_PAGE = 10;
export const SLOT_WINDOW_DAYS = 30; // the venue page shows the next 30 days
export const SLOTS_LIMIT = 100; // the API's maximum page size for slots

// GET /venues?q=&city=&category=&page=&limit=
export async function listVenues(search: VenueSearch, limit = VENUES_PER_PAGE) {
  const response = await api.get<Venue[]>('/venues', {
    query: { q: search.q, city: search.city, category: search.category, page: search.page, limit },
  });

  const pagination = response.meta.pagination ?? {
    page: search.page,
    limit,
    total: response.data.length,
    totalPages: 1,
  };

  return { venues: response.data, pagination };
}

// GET /venues/:id  (the API answers 404 VENUE_NOT_FOUND for missing or deactivated venues)
export async function getVenue(id: number) {
  const response = await api.get<VenueDetail>(`/venues/${id}`);
  return response.data;
}

// GET /venues/:id/slots  (the API starts from "now" when we send no "from")
export async function listSlots(venueId: number, options: { availableOnly: boolean }) {
  const response = await api.get<Slot[]>(`/venues/${venueId}/slots`, {
    query: {
      to: addDays(new Date(), SLOT_WINDOW_DAYS).toISOString(),
      available: options.availableOnly ? 'true' : undefined,
      limit: SLOTS_LIMIT,
    },
  });

  return { slots: response.data, total: response.meta.pagination?.total ?? response.data.length };
}