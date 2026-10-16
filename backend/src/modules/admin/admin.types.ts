import type { Role } from '../../shared/types/express.d.ts';

// A user as the admin screen sees it. There is NO password_hash here: it must never leave the repository.
export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: Date;
  venues_count: number;
  bookings_count: number;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  venuesCount: number; // venues this user owns
  bookingsCount: number; // bookings this user made (all statuses)
};
