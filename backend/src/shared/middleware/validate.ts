import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type Schemas = { body?: ZodType; params?: ZodType; query?: ZodType };

// OUTER function: runs ONCE, when the server starts and the route is defined.
export function validate(schemas: Schemas) {

  return function validateMiddleware(req: Request, _res: Response, next: NextFunction) {

    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as typeof req.params;
    }

    // In Express 5 req.query is read-only, so we redefine it
    if (schemas.query) {
      Object.defineProperty(req, "query", {
        value: schemas.query.parse(req.query),
        writable: true,
        configurable: true,
      });
    }

    next();
  };
}
