import { z } from 'zod';

// "2026-11-01T09:00:00Z" or "2026-11-01T14:00:00+05:00". A time WITHOUT a zone is rejected on purpose.
const isoDateTime = z.iso.datetime({ offset: true });

// Shared by create and update. No defaults, so a partial update never overwrites anything.
const slotFields = {
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  pricePkr: z.number().int().min(0).max(10_000_000),
};

export const createSlotSchema = z.object(slotFields);

export const updateSlotSchema = z
  .object(slotFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Send at least one field to update' });

export const venueIdParamSchema = z.object({ venueId: z.coerce.number().int().positive() });
export const slotIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const listSlotsQuerySchema = z.object({
  from: isoDateTime.optional(), // default "now" is a business rule, so the service applies it
  to: isoDateTime.optional(),
  // "?available=true" hides booked slots. Not z.coerce.boolean(): it turns the text "false" into true.
  available: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type ListSlotsQuery = z.infer<typeof listSlotsQuerySchema>;
