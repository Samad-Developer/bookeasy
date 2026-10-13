import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72),
  role: z.enum(['customer', 'owner']).default('customer'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;