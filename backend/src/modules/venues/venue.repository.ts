import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.ts';
import type { CreateVenueInput, UpdateVenueInput } from './venue.schema.ts';
import { toVenue } from './venue.mapper.ts';
import type { VenueRow } from './venue.types.ts';

type Db = Pool | PoolClient;

// We list the columns instead of using * so the big `search` column is never sent
// The cover photo and the photo count come from small sub-queries, so one venue stays one row.
const VENUE_COLUMNS = `venues.id, venues.owner_id, venues.name, venues.description, venues.category, venues.city,
  venues.address, venues.capacity, venues.is_active, venues.created_at,
  (SELECT vi.url FROM venue_images vi WHERE vi.venue_id = venues.id ORDER BY vi.position, vi.id LIMIT 1) AS cover_image_url,
  (SELECT vi.thumb_url FROM venue_images vi WHERE vi.venue_id = venues.id ORDER BY vi.position, vi.id LIMIT 1) AS cover_thumb_url,
  (SELECT count(*)::int FROM venue_images vi WHERE vi.venue_id = venues.id) AS image_count`;

export async function insertVenue(ownerId: number, data: CreateVenueInput, db: Db = pool) {
  const { rows } = await db.query<VenueRow>(
    `INSERT INTO venues (owner_id, name, description, category, city, address, capacity)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${VENUE_COLUMNS}`,
    [ownerId, data.name, data.description, data.category, data.city, data.address, data.capacity],
  );
  return toVenue(rows[0]);
}

export async function findVenueById(id: number, db: Db = pool) {
  const { rows } = await db.query<VenueRow>(`SELECT ${VENUE_COLUMNS} FROM venues WHERE id = $1`, [id]);
  return rows[0] ? toVenue(rows[0]) : undefined;
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
  return toVenue(rows[0]);
}

type Filters = {
  city?: string;
  category?: string;
  ownerId?: number;
  search?: string;
  onlyActive: boolean; // true = hide deactivated venues (public pages)
  isActive?: boolean; // exact filter, for the admin screen (only meaningful when onlyActive is false)
};

// Builds "WHERE ..." from the filters that were actually given
function buildWhere(filters: Filters) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let searchParam: number | undefined; // position ($n) of the search text, reused for ranking

  if (filters.onlyActive) conditions.push('is_active = true');
  if (filters.isActive !== undefined) {
    params.push(filters.isActive);
    conditions.push(`is_active = $${params.length}`);
  }
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

  if (filters.search) {
    params.push(filters.search);
    searchParam = params.length;
    // `search` is the generated tsvector column; the GIN index makes this fast
    conditions.push(`search @@ plainto_tsquery('english', $${searchParam})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params, searchParam };
}

export async function findVenues(filters: Filters, page: number, limit: number, db: Db = pool) {
  const { where, params, searchParam } = buildWhere(filters);

  // Best match first when searching; newest first otherwise
  const orderBy =
    searchParam === undefined
      ? 'ORDER BY id DESC'
      : `ORDER BY ts_rank(search, plainto_tsquery('english', $${searchParam})) DESC, id DESC`;

  // Two separate queries so `total` is correct even when the requested page is past the end
  const listParams = [...params, limit, (page - 1) * limit];
  const [list, count] = await Promise.all([
    db.query<VenueRow>(
      `SELECT ${VENUE_COLUMNS} FROM venues ${where}
       ${orderBy}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      listParams,
    ),
    db.query<{ total: number }>(`SELECT count(*)::int AS total FROM venues ${where}`, params),
  ]);

  return { venues: list.rows.map(toVenue), total: count.rows[0].total };
}