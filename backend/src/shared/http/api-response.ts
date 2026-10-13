import type { Request, Response } from "express";
import type { ErrorDetail } from "../errors/app-error.ts";

// The ONE place that defines how every response looks (success and error).

type Meta = Record<string, unknown>;

function baseMeta(req: Request, extra?: Meta) {
  return {
    timestamp: new Date().toISOString(),
    traceId: req.traceId,
    ...extra,
  };
}

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function sendSuccess<T>(
  req: Request,
  res: Response,
  options: { data: T; message: string; statusCode?: number; meta?: Meta },
) {
  const statusCode = options.statusCode ?? 200;
  res.status(statusCode).json({
    success: true,
    statusCode,
    message: options.message,
    data: options.data,
    meta: baseMeta(req, options.meta),
  });
}

export function sendError(
  req: Request,
  res: Response,
  options: {
    statusCode: number;
    code: string;
    message: string;
    details?: ErrorDetail[];
  },
) {
  res.status(options.statusCode).json({
    success: false,
    statusCode: options.statusCode,
    message: options.message,
    data: null,
    error: { code: options.code, details: options.details ?? [] },
    meta: baseMeta(req),
  });
}

export function buildPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
