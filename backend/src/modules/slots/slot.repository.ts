import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.ts';
import { toSlot } from './slot.mapper.ts';
import type { CreateSlotInput, UpdateSlotInput } from './slot.schema.ts';
import type { SlotRow } from './slot.types.ts';

type Db = Pool | PoolClient;

// A slot is "booked" when a confirmed booking points at it. Works in SELECT and in RETURNING.
const IS_BOOKED = `EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = venue_slots.id AND b.status = 'confirmed')`;
const SLOT_COLUMNS = `id, venue_id, starts_at, ends_at, price_pkr, created_at, ${IS_BOOKED} AS is_booked`;

export async function insertSlot(venueId: number, data: CreateSlotInput, db: Db = pool) {
  const { rows } = await db.query<SlotRow>(
    `INSERT INTO venue_slots (venue_id, starts_at, ends_at, price_pkr)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SLOT_COLUMNS}`,
    [venueId, data.startsAt, data.endsAt, data.pricePkr],
  );
  return toSlot(rows[0]);
}

export async function findSlotById(id: number, db: Db = pool) {
  const { rows } = await db.query<SlotRow>(`SELECT ${SLOT_COLUMNS} FROM venue_slots WHERE id = $1`, [id]);
  return rows[0] ? toSlot(rows[0]) : undefined;
}

type SlotRange = { from: string; to?: string; onlyAvailable?: boolean };

// A slot is listed when it ENDS after `from` (so a slot already running is still shown)
// and STARTS before `to`.
export async function findSlotsByVenue(venueId: number, range: SlotRange, page: number, limit: number, db: Db = pool) {
  const params: unknown[] = [venueId, range.from];
  let where = 'venue_id = $1 AND ends_at > $2';
  if (range.to) {
    params.push(range.to);
    where += ` AND starts_at < $${params.length}`;
  }
  if (range.onlyAvailable) where += ` AND NOT ${IS_BOOKED}`;

  const [list, count] = await Promise.all([
    db.query<SlotRow>(
      `SELECT ${SLOT_COLUMNS} FROM venue_slots
       WHERE ${where}
       ORDER BY starts_at
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
    db.query<{ total: number }>(`SELECT count(*)::int AS total FROM venue_slots WHERE ${where}`, params),
  ]);

  return { slots: list.rows.map(toSlot), total: count.rows[0].total };
}

const UPDATABLE_COLUMNS = {
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  pricePkr: 'price_pkr',
} as const;

// `timesChanged` adds a guard INSIDE the same statement: moving a slot that already has a
// confirmed booking would silently change what the customer paid for, so no row is updated.
export async function updateSlotById(
  id: number,
  changes: UpdateSlotInput,
  timesChanged: boolean,
  db: Db = pool,
) {
  const assignments: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
    const value = changes[key as keyof UpdateSlotInput];
    if (value !== undefined) {
      params.push(value);
      assignments.push(`${column} = $${params.length}`);
    }
  }

  params.push(id);
  const guard = timesChanged
    ? `AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = venue_slots.id AND b.status = 'confirmed')`
    : '';

  const { rows } = await db.query<SlotRow>(
    `UPDATE venue_slots SET ${assignments.join(', ')}
     WHERE id = $${params.length} ${guard}
     RETURNING ${SLOT_COLUMNS}`,
    params,
  );
  return rows[0] ? toSlot(rows[0]) : undefined;
}

// Only deletes a slot nobody ever booked (bookings keep a reference to their slot)
export async function deleteSlotById(id: number, db: Db = pool) {
  const { rowCount } = await db.query(
    `DELETE FROM venue_slots
     WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = venue_slots.id)`,
    [id],
  );
  return (rowCount ?? 0) > 0;
}
