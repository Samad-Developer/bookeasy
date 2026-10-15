import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.ts';
import { toBooking } from './booking.mapper.ts';
import type { BookingRow, BookingStatus } from './booking.types.ts';

type Db = Pool | PoolClient;

// One SELECT used everywhere, so every booking comes back with its slot, venue and customer
const BOOKING_SELECT = `
  SELECT b.id, b.slot_id, b.customer_id, u.name AS customer_name, b.status, b.price_pkr,
         b.created_at, b.cancelled_at, s.starts_at, s.ends_at,
         v.id AS venue_id, v.name AS venue_name, v.city AS venue_city, v.owner_id AS venue_owner_id
  FROM bookings b
  JOIN venue_slots s ON s.id = b.slot_id
  JOIN venues v ON v.id = s.venue_id
  JOIN users u ON u.id = b.customer_id`;

export async function findBookingById(id: number, db: Db = pool) {
  const { rows } = await db.query<BookingRow>(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
  return rows[0] ? toBooking(rows[0]) : undefined;
}

// The price is copied from the slot INSIDE this statement, so it is the price at this exact moment.
// If another confirmed booking already holds the slot, the partial unique index
// `bookings_one_active_per_slot` rejects this INSERT (error 23505).
export async function insertBooking(slotId: number, customerId: number, db: Db = pool) {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO bookings (slot_id, customer_id, price_pkr)
     SELECT id, $2, price_pkr FROM venue_slots WHERE id = $1
     RETURNING id`,
    [slotId, customerId],
  );
  return rows[0] ? findBookingById(rows[0].id, db) : undefined;
}

// Only a confirmed booking can be cancelled. Checking the status INSIDE the statement means two
// simultaneous cancel requests cannot both succeed: the second one updates zero rows.
export async function cancelBookingById(id: number, db: Db = pool) {
  const { rows } = await db.query<{ id: number }>(
    `UPDATE bookings SET status = 'cancelled', cancelled_at = now()
     WHERE id = $1 AND status = 'confirmed'
     RETURNING id`,
    [id],
  );
  return rows[0] ? findBookingById(rows[0].id, db) : undefined;
}

type Filters = { customerId?: number; venueId?: number; status?: BookingStatus };

// The conditions only touch bookings (b) and slots (s), so the count query needs just those two tables
function buildWhere(filters: Filters) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.customerId !== undefined) {
    params.push(filters.customerId);
    conditions.push(`b.customer_id = $${params.length}`);
  }
  if (filters.venueId !== undefined) {
    params.push(filters.venueId);
    conditions.push(`s.venue_id = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`b.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

export async function findBookings(filters: Filters, page: number, limit: number, db: Db = pool) {
  const { where, params } = buildWhere(filters);

  const [list, count] = await Promise.all([
    db.query<BookingRow>(
      `${BOOKING_SELECT} ${where}
       ORDER BY b.created_at DESC, b.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
    db.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM bookings b JOIN venue_slots s ON s.id = b.slot_id ${where}`,
      params,
    ),
  ]);

  return { bookings: list.rows.map(toBooking), total: count.rows[0].total };
}
