import type { ErrorRequestHandler } from "express";
import { DatabaseError } from "pg";
import { ZodError } from "zod";
import { sendError } from "../http/api-response.ts";
import { AppError } from "./app-error.ts";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // If the response already started, Express must close the connection itself
  if (res.headersSent) {
    return next(error);
  }

  // 1. Errors we throw on purpose (business rules, auth, not found)
  if (error instanceof AppError) {
    sendError(req, res, {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  // 2. Zod validation errors from the validate middleware
  if (error instanceof ZodError) {
    sendError(req, res, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed for the request payload.",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        issue: issue.message,
      })),
    });
    return;
  }

  // 3. Body parser errors from express.json()
  const parserError = error as { type?: string };
  if (parserError?.type === "entity.parse.failed") {
    sendError(req, res, {
      statusCode: 400,
      code: "INVALID_JSON",
      message: "Request body is not valid JSON.",
    });
    return;
  }
  if (parserError?.type === "entity.too.large") {
    sendError(req, res, {
      statusCode: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: "Request body is too large.",
    });
    return;
  }

  // 4. Database constraint errors: the safety net when a service did not handle them
  if (error instanceof DatabaseError) {
    if (error.code === "23505") {
      sendError(req, res, {
        statusCode: 409,
        code: "DATABASE_CONFLICT",
        message: "Resource already exists.",
      });
      return;
    }
    if (error.code === "23503") {
      sendError(req, res, {
        statusCode: 409,
        code: "REFERENCE_CONFLICT",
        message: "Related resource conflict.",
      });
      return;
    }
    if (error.code === "23514") {
      sendError(req, res, {
        statusCode: 422,
        code: "CONSTRAINT_VIOLATION",
        message: "Data violates a database rule.",
      });
      return;
    }
  }

  // 5. Anything unexpected: log it with the trace id, hide details from the client
  console.error(`[${req.traceId}]`, error);
  sendError(req, res, {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error.",
  });
};
