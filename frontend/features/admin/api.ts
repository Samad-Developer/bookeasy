import { api } from '@/lib/api-client';
import type { AdminUser, PlatformStats, UserFilters, VenueFilters } from '@/features/admin/types';
import type { Booking, BookingFilter } from '@/features/bookings/types';
import type { Venue } from '@/features/venues/types';
import type { Role } from '@/types/api';

// One function per admin endpoint. No React in this file.

export const ADMIN_PER_PAGE = 10;

function pageInfo(meta: { pagination?: { page: number; limit: number; total: number; totalPages: number } }, page: number, count: number) {
  return meta.pagination ?? { page, limit: ADMIN_PER_PAGE, total: count, totalPages: 1 };
}

// GET /stats/platform
export async function getPlatformStats() {
  const response = await api.get<PlatformStats>('/stats/platform');
  return response.data;
}

// GET /admin/users
export async function listUsers(filters: UserFilters, page: number) {
  const response = await api.get<AdminUser[]>('/admin/users', {
    query: { q: filters.q, role: filters.role, isActive: filters.isActive, page, limit: ADMIN_PER_PAGE },
  });
  return { users: response.data, pagination: pageInfo(response.meta, page, response.data.length) };
}

// PATCH /admin/users/:id   (the API refuses to change your OWN account)
export async function updateUser(id: number, changes: { isActive?: boolean; role?: Role }) {
  const response = await api.patch<AdminUser>(`/admin/users/${id}`, changes);
  return response.data;
}

// GET /admin/venues   (includes hidden venues)
export async function listAllVenues(filters: VenueFilters, page: number) {
  const response = await api.get<Venue[]>('/admin/venues', {
    query: { q: filters.q, category: filters.category, isActive: filters.isActive, page, limit: ADMIN_PER_PAGE },
  });
  return { venues: response.data, pagination: pageInfo(response.meta, page, response.data.length) };
}

// PATCH /venues/:id   (an admin may hide or show any venue)
export async function setVenueActive(id: number, isActive: boolean) {
  const response = await api.patch<Venue>(`/venues/${id}`, { isActive });
  return response.data;
}

// GET /admin/bookings
export async function listAllBookings(status: BookingFilter, page: number) {
  const response = await api.get<Booking[]>('/admin/bookings', { query: { status, page, limit: ADMIN_PER_PAGE } });
  return { bookings: response.data, pagination: pageInfo(response.meta, page, response.data.length) };
}