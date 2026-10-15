import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.ts";
import { AppError } from "../errors/app-error.ts";
import type { Role } from "../types/express.d.ts";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    throw new AppError(401, "UNAUTHENTICATED", "Missing access token");

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as jwt.JwtPayload;

    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    throw new AppError(
      401,
      "INVALID_TOKEN",
      "Access token is invalid or expired",
    );
  }
}

export const requireRole =
  (...roles: Role[]) =>
    (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new AppError(
          403,
          "FORBIDDEN",
          "You do not have permission to do this",
        );
      }
      next();
    };

// For public routes that behave differently when the visitor is logged in.
// No token = continue as a guest. A token that is present must be valid.
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization) return next();
  return requireAuth(req, res, next);
}
