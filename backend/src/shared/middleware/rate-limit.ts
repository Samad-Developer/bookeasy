import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.ts';
import { sendError } from '../http/api-response.ts';

// Builds a limiter that answers in our normal error envelope (not express-rate-limit's plain text)
function limiter(options: { windowMs: number; max: number; code: string; message: string; countOnlyFailures?: boolean }) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: 'draft-7', // sends RateLimit and Retry-After headers
    legacyHeaders: false,
    // For login: a correct password does not use up an attempt, only failed attempts count
    skipSuccessfulRequests: options.countOnlyFailures ?? false,
    handler: (req, res) => {
      sendError(req, res, { statusCode: 429, code: options.code, message: options.message });
    },
  });
}

// Stops password guessing: 10 failed logins per IP per 15 minutes
export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_LOGIN_MAX,
  code: 'TOO_MANY_LOGIN_ATTEMPTS',
  message: 'Too many failed login attempts. Try again in a few minutes.',
  countOnlyFailures: true,
});

// Stops fake-account spam
export const signupLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: env.RATE_LIMIT_SIGNUP_MAX,
  code: 'TOO_MANY_SIGNUPS',
  message: 'Too many accounts created from this address. Try again later.',
});