import { z } from 'zod';
import { VENUE_CATEGORIES } from '@/features/venues/types';

// These mirror the Zod schemas in the backend (venue.schema.ts and slot.schema.ts) with friendlier messages.
// The backend still checks everything again: the browser can never be trusted.
//
// Number fields are kept as TEXT inside the form (that is what an <input> gives us)
// and turned into numbers when we send them (see toVenueInput / toSlotInput).

export const venueSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120, 'Name must be at most 120 characters'),
  category: z.enum(VENUE_CATEGORIES, { message: 'Choose a type' }),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(60, 'City must be at most 60 characters'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters').max(200, 'Address must be at most 200 characters'),
  capacity: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Enter a whole number, for example 300')
    .refine((value) => Number(value) >= 1 && Number(value) <= 100_000, 'Capacity must be between 1 and 100,000'),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters'),
});

export type VenueFormValues = z.infer<typeof venueSchema>;

export function toVenueInput(values: VenueFormValues) {
  return { ...values, capacity: Number(values.capacity) };
}

const MAX_SLOT_HOURS = 24;
const MAX_PRICE = 10_000_000;

export const priceField = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Enter the price as a whole number, for example 90000')
  .refine((value) => Number(value) <= MAX_PRICE, 'Price must be at most 10,000,000');

// <input type="datetime-local"> gives "2026-11-01T09:00" (the visitor's own time zone)
export const slotSchema = z
  .object({
    startsAt: z.string().min(1, 'Choose a start time'),
    endsAt: z.string().min(1, 'Choose an end time'),
    price: priceField,
  })
  .superRefine((values, context) => {
    if (!values.startsAt || !values.endsAt) return;

    const start = new Date(values.startsAt);
    const end = new Date(values.endsAt);

    if (start <= new Date()) {
      context.addIssue({ code: 'custom', path: ['startsAt'], message: 'The slot must start in the future' });
    }
    if (end <= start) {
      context.addIssue({ code: 'custom', path: ['endsAt'], message: 'The end must be after the start' });
    } else if ((end.getTime() - start.getTime()) / 3_600_000 > MAX_SLOT_HOURS) {
      context.addIssue({ code: 'custom', path: ['endsAt'], message: `A slot can be at most ${MAX_SLOT_HOURS} hours long` });
    }
  });

export type SlotFormValues = z.infer<typeof slotSchema>;

// "2026-11-01T09:00" typed in Pakistan -> "2026-11-01T04:00:00.000Z", which is what the API wants
export function toSlotInput(values: SlotFormValues) {
  return {
    startsAt: new Date(values.startsAt).toISOString(),
    endsAt: new Date(values.endsAt).toISOString(),
    pricePkr: Number(values.price),
  };
}