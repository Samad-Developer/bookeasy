import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),
  DB_SSL: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  // Verify the database server's certificate. Keep "true" unless your host gives you a self-signed one.
  DB_SSL_REJECT_UNAUTHORIZED: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  // Browser origins allowed to call this API (comma separated), e.g. the React dev server
  FRONTEND_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((o) => o.trim()).filter(Boolean)),
  // How many reverse proxies sit in front of the API (0 = none). Needed so rate limiting sees the real client IP.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  // Failed login attempts allowed per IP in 15 minutes
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().min(1).default(10),
  // Signups allowed per IP per hour
  RATE_LIMIT_SIGNUP_MAX: z.coerce.number().int().min(1).default(20),
  // Photo storage: any S3-compatible bucket (Supabase Storage, Cloudflare R2, AWS S3 ...).
  // The first five must be set together; when they are missing the API still starts,
  // and photo uploads answer 503 STORAGE_NOT_CONFIGURED.
  STORAGE_ENDPOINT: z.string().url().optional(), // Supabase: https://<project-ref>.storage.supabase.co/storage/v1/s3
  STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_BUCKET: z.string().min(1).optional(),
  STORAGE_PUBLIC_URL: z.string().url().optional(), // the public address of the bucket (no trailing slash needed)
  STORAGE_REGION: z.string().min(1).default('auto'), // Supabase: the region of your project, e.g. ap-south-1. R2: leave out.
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;