import { Pool } from 'pg';
import { env } from '../config/env.ts';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,

  // Pool size
  max: env.DB_POOL_MAX, // at most this many connections open at once
  idleTimeoutMillis: 30_000, // close a connection that has been unused for 30 s
  maxLifetimeSeconds: 60 * 30, // recycle every connection after 30 min

  // Fail fast instead of hanging forever
  connectionTimeoutMillis: 5_000, // waiting longer than 5 s for a free connection = error (default: wait forever)
  statement_timeout: 15_000, // the database cancels any query that runs longer than 15 s
  idle_in_transaction_session_timeout: 30_000, // the database kills a transaction left open and idle for 30 s

  application_name: 'bookeasy-api', // shows up in pg_stat_activity so you can see who is connected

  // Hosted databases (Neon, Supabase, Render...) require SSL
  ssl: env.DB_SSL ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED } : undefined,
});

// An idle connection can break (database restart, network drop). Without this handler the process would crash.
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});