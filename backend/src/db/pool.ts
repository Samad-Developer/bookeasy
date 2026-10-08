import { Pool } from 'pg';
import { env } from '../config/env.ts';

export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});