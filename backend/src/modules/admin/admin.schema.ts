import { z } from 'zod';
import { listBookingsQuerySchema } from '../bookings/booking.schema.ts';
import { listVenuesQuerySchema } from '../venues/venue.schema.ts';

const ROLES = ['customer', 'owner', 'admin'] as const;

// "?isActive=true" -> true. Not z.coerce.boolean(): it turns the text "false" into true.
const booleanText = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();

export const listUsersQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => value || undefined)
    .optional(),
  role: z.enum(ROLES).optional(),
  isActive: booleanText,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const updateUserSchema = z
  .object({
    isActive: z.boolean(),
    role: z.enum(ROLES),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Send at least one field to update' });

export const userIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

// The public venue filters (q, city, category, page, limit) plus two admin-only ones
export const adminVenuesQuerySchema = listVenuesQuerySchema.extend({
  ownerId: z.coerce.number().int().positive().optional(),
  isActive: booleanText,
});

// The booking list filters (status, page, limit) plus who and where
export const adminBookingsQuerySchema = listBookingsQuerySchema.extend({
  customerId: z.coerce.number().int().positive().optional(),
  venueId: z.coerce.number().int().positive().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AdminVenuesQuery = z.infer<typeof adminVenuesQuerySchema>;
export type AdminBookingsQuery = z.infer<typeof adminBookingsQuerySchema>;
