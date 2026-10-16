import { Router } from "express";
import { requireAuth, requireRole } from "../../shared/middleware/auth.ts";
import { validate } from "../../shared/middleware/validate.ts";
import * as controller from "./stats.controller.ts";
import { statsQuerySchema } from "./stats.schema.ts";

export const statsRouter = Router();

statsRouter.get(
  "/owner",
  requireAuth,
  requireRole("owner"),
  validate({ query: statsQuerySchema }),
  controller.owner,
);
statsRouter.get(
  "/platform",
  requireAuth,
  requireRole("admin"),
  validate({ query: statsQuerySchema }),
  controller.platform,
);
