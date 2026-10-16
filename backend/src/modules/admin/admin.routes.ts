import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.ts';
import { validate } from '../../shared/middleware/validate.ts';
import * as controller from './admin.controller.ts';
import {
  adminBookingsQuerySchema,
  adminVenuesQuerySchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './admin.schema.ts';

export const adminRouter = Router();

// One line protects every route below: nobody but an admin gets past it
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/users', validate({ query: listUsersQuerySchema }), controller.listUsers);
adminRouter.patch('/users/:id', validate({ params: userIdParamSchema, body: updateUserSchema }), controller.updateUser);
adminRouter.get('/venues', validate({ query: adminVenuesQuerySchema }), controller.listVenues);
adminRouter.get('/bookings', validate({ query: adminBookingsQuerySchema }), controller.listBookings);
