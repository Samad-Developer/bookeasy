import { Router } from "express";
import {
  optionalAuth,
  requireAuth,
  requireRole,
} from "../../shared/middleware/auth.ts";
import { validate } from "../../shared/middleware/validate.ts";
import * as controller from "./venue.controller.ts";
import {
  createVenueSchema,
  listVenuesQuerySchema,
  paginationQuerySchema,
  updateVenueSchema,
  venueIdParamSchema,
} from "./venue.schema.ts";

export const venueRouter = Router();

// Public
venueRouter.get(
  "/",
  validate({ query: listVenuesQuerySchema }),
  controller.list,
);

// Owner only. This MUST be declared before '/:id', otherwise "mine" would be read as an id.
venueRouter.get(
  "/mine",
  requireAuth,
  requireRole("owner"),
  validate({ query: paginationQuerySchema }),
  controller.listMine,
);

venueRouter.get(
  "/:id",
  optionalAuth,
  validate({ params: venueIdParamSchema }),
  controller.getOne,
);

venueRouter.post(
  "/",
  requireAuth,
  requireRole("owner"),
  validate({ body: createVenueSchema }),
  controller.create,
);

venueRouter.patch(
  "/:id",
  requireAuth,
  requireRole("owner", "admin"),
  validate({ params: venueIdParamSchema, body: updateVenueSchema }),
  controller.update,
);
