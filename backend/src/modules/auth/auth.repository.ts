import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.ts';
import type { Role } from '../../shared/types/express.d.ts';
import type { UserRow } from './auth.types.ts';

// Every function takes an optional `db`: the normal pool, or a transaction client
type Db = Pool | PoolClient;

const USER_COLUMNS = 'id, email, name, role, password_hash, is_active';

export async function findUserByEmail(email: string, db: Db = pool) {
  const { rows } = await db.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [email]);
  return rows[0];
}

export async function findUserById(id: number, db: Db = pool) {
  const { rows } = await db.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0];
}

export async function insertUser(
  data: { email: string; passwordHash: string; name: string; role: Role },
  db: Db = pool,
) {
  const { rows } = await db.query<UserRow>(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLUMNS}`,
    [data.email, data.passwordHash, data.name, data.role],
  );
  return rows[0];
}

export async function insertRefreshToken(
  data: { userId: number; tokenHash: string; days: number },
  db: Db = pool,
) {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + make_interval(days => $3))`,
    [data.userId, data.tokenHash, data.days],
  );
}

// Deletes the token and returns its owner in ONE statement, so two requests
// with the same token can never both succeed
export async function consumeRefreshToken(tokenHash: string, db: Db = pool) {
  const { rows } = await db.query<UserRow>(
    `DELETE FROM refresh_tokens rt
     USING users u
     WHERE rt.token_hash = $1 AND rt.expires_at > now() AND u.id = rt.user_id
     RETURNING u.id, u.email, u.name, u.role, u.password_hash, u.is_active`,
    [tokenHash],
  );
  return rows[0];
}

export async function deleteRefreshToken(tokenHash: string, db: Db = pool) {
  await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}