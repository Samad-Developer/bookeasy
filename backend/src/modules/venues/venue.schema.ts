import { z } from "zod";

// The single place that lists the allowed categories. Add new ones here.
export const VENUE_CATEGORIES = [
  "wedding_hall",
  "party_lawn",
  "conference_room",
  "meeting_room",
  "sports_arena",
  "studio",
  "other",
] as const;

// "  lAHore  " -> "Lahore", so the same city is always stored and searched the same way
const city = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .transform((value) =>
    value
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  );

// The fields shared by "create" and "update". No defaults here: a default would
// silently overwrite existing data when a field is left out of an update.
const venueFields = {
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000),
  category: z.enum(VENUE_CATEGORIES),
  city,
  address: z.string().trim().min(5).max(200),
  capacity: z.number().int().min(1).max(100000),
};

export const createVenueSchema = z.object({
  ...venueFields,
  description: venueFields.description.default(""), // only a new venue gets an empty description by default
});

export const updateVenueSchema = z
  .object(venueFields)
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Send at least one field to update",
  });

export const venueIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

export const listVenuesQuerySchema = z.object({
  ...pagination,
  city: city.optional(),
  category: z.enum(VENUE_CATEGORIES).optional(),
  q: z.string().trim().max(100).transform((value) => value || undefined).optional(),
});

export const paginationQuerySchema = z.object(pagination);

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type ListVenuesQuery = z.infer<typeof listVenuesQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
