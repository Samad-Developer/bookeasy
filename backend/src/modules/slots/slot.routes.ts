import { Router } from 'express';
import { optionalAuth, requireAuth, requireRole } from '../../shared/middleware/auth.ts';
import { validate } from '../../shared/middleware/validate.ts';
import * as controller from './slot.controller.ts';
import {
  createSlotSchema,
  listSlotsQuerySchema,
  slotIdParamSchema,
  updateSlotSchema,
  venueIdParamSchema,
} from './slot.schema.ts';

// Mounted at the app root because the paths start in two places: /venues/:venueId/slots and /slots/:id
export const slotRouter = Router();

slotRouter.get(
  '/venues/:venueId/slots',
  optionalAuth,
  validate({ params: venueIdParamSchema, query: listSlotsQuerySchema }),
  controller.list,
);

slotRouter.post(
  '/venues/:venueId/slots',
  requireAuth,
  requireRole('owner', 'admin'),
  validate({ params: venueIdParamSchema, body: createSlotSchema }),
  controller.create,
);

slotRouter.patch(
  '/slots/:id',
  requireAuth,
  requireRole('owner', 'admin'),
  validate({ params: slotIdParamSchema, body: updateSlotSchema }),
  controller.update,
);

slotRouter.delete(
  '/slots/:id',
  requireAuth,
  requireRole('owner', 'admin'),
  validate({ params: slotIdParamSchema }),
  controller.remove,
);
