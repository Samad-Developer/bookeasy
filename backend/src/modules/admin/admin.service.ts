import { withTransaction } from '../../db/transaction.ts';
import { AppError } from '../../shared/errors/app-error.ts';
import * as bookingRepo from '../bookings/booking.repository.ts';
import * as venueRepo from '../venues/venue.repository.ts';
import * as repo from './admin.repository.ts';
import type { AdminBookingsQuery, AdminVenuesQuery, ListUsersQuery, UpdateUserInput } from './admin.schema.ts';

export async function listUsers(query: ListUsersQuery) {
  const { users, total } = await repo.findUsers(
    { q: query.q, role: query.role, isActive: query.isActive },
    query.page,
    query.limit,
  );
  return { items: users, total };
}

export async function updateUser(adminId: number, userId: number, changes: UpdateUserInput) {
  // An admin cannot lock themselves out or demote themselves. Another admin has to do it,
  // so the platform can never end up with zero admins.
  if (userId === adminId) {
    throw new AppError(409, 'CANNOT_MODIFY_SELF', 'You cannot change your own role or status');
  }

  const user = await repo.findUserById(userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  // A role lives inside the access token for up to 15 minutes, and a disabled user must lose access.
  // Deleting the refresh tokens forces a fresh login, which sees the new role / status.
  const mustLogOut = changes.isActive === false || (changes.role !== undefined && changes.role !== user.role);

  return withTransaction(async (client) => {
    const updated = await repo.updateUserById(userId, changes, client);
    if (mustLogOut) await repo.deleteRefreshTokensOfUser(userId, client);
    return updated!;
  });
}

// The admin sees every venue, including deactivated ones
export async function listVenues(query: AdminVenuesQuery) {
  const { venues, total } = await venueRepo.findVenues(
    {
      city: query.city,
      category: query.category,
      ownerId: query.ownerId,
      search: query.q,
      isActive: query.isActive,
      onlyActive: false,
    },
    query.page,
    query.limit,
  );
  return { items: venues, total };
}

export async function listBookings(query: AdminBookingsQuery) {
  const { bookings, total } = await bookingRepo.findBookings(
    { customerId: query.customerId, venueId: query.venueId, status: query.status },
    query.page,
    query.limit,
  );
  return { items: bookings, total };
}
