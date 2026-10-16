import type { AdminUser, AdminUserRow } from './admin.types.ts';

export const toAdminUser = (row: AdminUserRow): AdminUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  isActive: row.is_active,
  createdAt: row.created_at,
  venuesCount: row.venues_count,
  bookingsCount: row.bookings_count,
});
