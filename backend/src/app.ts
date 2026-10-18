import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.ts';
import { pool } from './db/pool.ts';
import { errorHandler } from './shared/errors/error-handler.ts';
import { sendSuccess } from './shared/http/api-response.ts';
import { notFound } from './shared/middleware/not-found.ts';
import { requestId } from './shared/middleware/request-id.ts';
import { requestLogger } from './shared/middleware/request-logger.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { venueRouter } from './modules/venues/venue.routes.ts';
import { slotRouter } from './modules/slots/slot.routes.ts';
import { bookingRouter } from './modules/bookings/booking.routes.ts';
import { statsRouter } from './modules/stats/stats.routes.ts';
import { adminRouter } from './modules/admin/admin.routes.ts';

export const app = express();

// Behind a reverse proxy (Render, Railway, nginx) req.ip would be the proxy's address without this
app.set('trust proxy', env.TRUST_PROXY_HOPS);

app.use(requestId);
app.use(requestLogger);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // security headers; this is an API consumed from another origin
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN, // only our frontend, never "*" (a wildcard is not allowed together with cookies)
    credentials: true, // lets the browser send and receive the refresh-token cookie
    exposedHeaders: ['X-Trace-Id'], // lets frontend code read the trace id
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/health', async (req, res) => {
  await pool.query('SELECT 1');
  sendSuccess(req, res, { data: { db: 'up' }, message: 'Service is healthy.' });
});

app.use('/auth', authRouter);
app.use('/venues', venueRouter);
app.use(slotRouter);
app.use(bookingRouter);
app.use('/stats', statsRouter);
app.use('/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);