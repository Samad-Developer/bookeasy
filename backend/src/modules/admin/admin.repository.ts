import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.ts';
import type { Role } from '../../shared/types/express.ts';
import { toAdminUser } from './admin.mapper.ts';
import type { AdminUserRow } from './admin.types.ts';

type Db = Pool | PoolClient;

// Counts come from small sub-queries, so one row stays one user
const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
         (SELECT count(*)::int FROM venues v WHERE v.owner_id = u.id)    AS venues_count,
         (SELECT count(*)::int FROM bookings b WHERE b.customer_id = u.id) AS bookings_count
  FROM users u`;

// In LIKE, "%" and "_" are wildcards. A search for "50%" must find the text "50%", not everything.
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

type UserFilters = { q?: string; role?: Role; isActive?: boolean };

function buildWhere(filters: UserFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${escapeLike(filters.q)}%`);
    conditions.push(`(u.name ILIKE $${params.length} ESCAPE '\\' OR u.email ILIKE $${params.length} ESCAPE '\\')`);
  }
  if (filters.role) {
    params.push(filters.role);
    conditions.push(`u.role = $${params.length}`);
  }
  if (filters.isActive !== undefined) {
    params.push(filters.isActive);
    conditions.push(`u.is_active = $${params.length}`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

export async function findUsers(filters: UserFilters, page: number, limit: number, db: Db = pool) {
  const { where, params } = buildWhere(filters);

  const [list, count] = await Promise.all([
    db.query<AdminUserRow>(
      `${USER_SELECT} ${where}
       ORDER BY u.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
    db.query<{ total: number }>(`SELECT count(*)::int AS total FROM users u ${where}`, params),
  ]);

  return { users: list.rows.map(toAdminUser), total: count.rows[0].total };
}

export async function findUserById(id: number, db: Db = pool) {
  const { rows } = await db.query<AdminUserRow>(`${USER_SELECT} WHERE u.id = $1`, [id]);
  return rows[0] ? toAdminUser(rows[0]) : undefined;
}

export async function updateUserById(id: number, changes: { isActive?: boolean; role?: Role }, db: Db = pool) {
  const assignments: string[] = [];
  const params: unknown[] = [];

  if (changes.isActive !== undefined) {
    params.push(changes.isActive);
    assignments.push(`is_active = $${params.length}`);
  }
  if (changes.role !== undefined) {
    params.push(changes.role);
    assignments.push(`role = $${params.length}`);
  }

  params.push(id);
  await db.query(`UPDATE users SET ${assignments.join(', ')} WHERE id = $${params.length}`, params);
  return findUserById(id, db);
}

// Logs the user out everywhere: every refresh token they own is deleted
export async function deleteRefreshTokensOfUser(userId: number, db: Db = pool) {
  await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}
