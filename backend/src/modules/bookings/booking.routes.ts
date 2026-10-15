import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.ts';
import { validate } from '../../shared/middleware/validate.ts';
import * as controller from './booking.controller.ts';
import {
  bookingIdParamSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  venueIdParamSchema,
} from './booking.schema.ts';

// Mounted at the app root because the paths start in two places: /bookings and /venues/:venueId/bookings
export const bookingRouter = Router();

bookingRouter.post('/bookings', requireAuth, requireRole('customer'), validate({ body: createBookingSchema }), controller.create);

// MUST be declared before '/bookings/:id', otherwise "mine" would be read as an id
bookingRouter.get(
  '/bookings/mine',
  requireAuth,
  requireRole('customer'),
  validate({ query: listBookingsQuerySchema }),
  controller.listMine,
);

// Any logged-in user: the service decides who may see this particular booking
bookingRouter.get('/bookings/:id', requireAuth, validate({ params: bookingIdParamSchema }), controller.getOne);

bookingRouter.post('/bookings/:id/cancel', requireAuth, validate({ params: bookingIdParamSchema }), controller.cancel);

bookingRouter.get(
  '/venues/:venueId/bookings',
  requireAuth,
  requireRole('owner', 'admin'),
  validate({ params: venueIdParamSchema, query: listBookingsQuerySchema }),
  controller.listForVenue,
);
