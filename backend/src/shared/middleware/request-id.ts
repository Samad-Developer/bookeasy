import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

// Gives every request a trace id like "tr_8fa9102bc34d1e7a"
export function requestId(req: Request, res: Response, next: NextFunction) {
  req.traceId = `tr_${randomBytes(8).toString('hex')}`;
  res.setHeader('X-Trace-Id', req.traceId);
  next();
}