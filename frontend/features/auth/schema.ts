import { z } from 'zod';

// These mirror the Zod schemas in the backend (auth.schema.ts), with friendlier messages.
// The backend still validates everything again: the browser can never be trusted.

const email = z.string().trim().min(1, 'Enter your email').pipe(z.email('Enter a valid email address'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
    email,
    password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
    confirmPassword: z.string().min(1, 'Repeat your password'),
    role: z.enum(['customer', 'owner']),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;