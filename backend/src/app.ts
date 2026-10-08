import express, { type NextFunction, type Request, type Response } from 'express';
import { pool } from './db/pool.ts';

export const app = express();

app.use(express.json());

app.get('/health', async (_req: Request, res: Response) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', db: 'up' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Express 5 sends errors from async handlers here automatically
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
});