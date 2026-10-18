import type { NextFunction, Request, Response } from 'express';

// One JSON line per finished request: easy to read in a terminal and easy to search in a log tool.
// The trace id is the same one the client sees in X-Trace-Id and in the response meta,
// so a user's bug report ("trace id tr_ab12...") leads straight to this line.
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();

  // "finish" fires once the response has been fully sent
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const line = {
      time: new Date().toISOString(),
      traceId: req.traceId,
      method: req.method,
      path: req.originalUrl.split('?')[0], // never log the query string: it can hold personal data
      status: res.statusCode,
      ms: Math.round(durationMs),
      userId: req.user?.id ?? null,
      ip: req.ip,
    };
    // 5xx = our fault, 4xx = client's fault, rest = normal
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    console[level](JSON.stringify(line));
  });

  next();
}