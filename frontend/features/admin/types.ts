import type { OwnerMonthStats, OwnerSummary, OwnerVenueStats } from '@/features/owner/types';
import type { Role } from '@/types/api';

// Matches admin.types.ts and stats.types.ts in the backend.

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  venuesCount: number; // venues this user owns
  bookingsCount: number; // bookings this user made (all statuses)
};

export type WeekdayStats = { weekday: number; name: string; bookings: number }; // weekday 1 = Monday ... 7 = Sunday

// GET /stats/platform
export type PlatformStats = {
  summary: OwnerSummary; // same shape as the owner's summary, but for the whole platform
  byMonth: OwnerMonthStats[];
  byWeekday: WeekdayStats[];
  topVenues: OwnerVenueStats[];
  usersByRole: { role: Role; total: number }[];
};

export type UserFilters = {
  q: string;
  role: Role | undefined;
  isActive: boolean | undefined;
};

export type VenueFilters = {
  q: string;
  category: string | undefined;
  isActive: boolean | undefined;
};