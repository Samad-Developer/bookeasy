import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.ts';
import type { CreateVenueInput, UpdateVenueInput } from './venue.schema.ts';
import type { VenueRow } from './venue.types.ts';

type Db = Pool | PoolClient;

// We list the columns instead of using * so the big `search` column is never sent
const VENUE_COLUMNS = 'id, owner_id, name, description, category, city, address, capacity, is_active, created_at';

export async function insertVenue(ownerId: number, data: CreateVenueInput, db: Db = pool) {
  const { rows } = await db.query<VenueRow>(
    `INSERT INTO venues (owner_id, name, description, category, city, address, capacity)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${VENUE_COLUMNS}`,
    [ownerId, data.name, data.description, data.category, data.city, data.address, data.capacity],
  );
  return rows[0];
}

export async function findVenueById(id: number, db: Db = pool) {
  const { rows } = await db.query<VenueRow>(`SELECT ${VENUE_COLUMNS} FROM venues WHERE id = $1`, [id]);
  return rows[0];
}

// API field name -> database column. Only these can ever be updated.
const UPDATABLE_COLUMNS = {
  name: 'name',
  description: 'description',
  category: 'category',
  city: 'city',
  address: 'address',
  capacity: 'capacity',
  isActive: 'is_active',
} as const;

export async function updateVenueById(id: number, changes: UpdateVenueInput, db: Db = pool) {
  const assignments: string[] = [];
  const params: unknown[] = [];

  for (const field of Object.keys(UPDATABLE_COLUMNS) as Array<keyof typeof UPDATABLE_COLUMNS>) {
    const value = changes[field];
    if (value !== undefined) {
      params.push(value);
      // The column name comes from our own constant above, never from the user
      assignments.push(`${UPDATABLE_COLUMNS[field]} = $${params.length}`);
    }
  }

  params.push(id);
  const { rows } = await db.query<VenueRow>(
    `UPDATE venues SET ${assignments.join(', ')} WHERE id = $${params.length} RETURNING ${VENUE_COLUMNS}`,
    params,
  );
  return rows[0];
}

type Filters = { city?: string; category?: string; ownerId?: number; onlyActive?: boolean };

// Builds "WHERE ..." from the filters that were actually given
function buildWhere(filters: Filters) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.onlyActive) conditions.push('is_active = true');

  if (filters.ownerId !== undefined) {
    params.push(filters.ownerId);
    conditions.push(`owner_id = $${params.length}`);
  }

  if (filters.city) {
    params.push(filters.city);
    conditions.push(`city = $${params.length}`);
  }

  if (filters.category) {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

export async function findVenues(filters: Filters, page: number, limit: number, db: Db = pool) {
  const { where, params } = buildWhere(filters);

  // Two separate queries so `total` is correct even when the requested page is past the end
  const listParams = [...params, limit, (page - 1) * limit];

  const [list, count] = await Promise.all([
    db.query<VenueRow>(
      `SELECT ${VENUE_COLUMNS} FROM venues ${where}
       ORDER BY id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      listParams,
    ),
    db.query<{ total: number }>(`SELECT count(*)::int AS total FROM venues ${where}`, params),
  ]);

  return { rows: list.rows, total: count.rows[0].total };
}