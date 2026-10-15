import { z } from 'zod';

export const createBookingSchema = z.object({
  slotId: z.number().int().positive(),
});

export const bookingIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const venueIdParamSchema = z.object({ venueId: z.coerce.number().int().positive() });

export const listBookingsQuerySchema = z.object({
  status: z.enum(['confirmed', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
