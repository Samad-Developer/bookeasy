import { z } from 'zod';

export const MAX_IMAGES_PER_VENUE = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per uploaded file

export const venueImageParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const venueImageItemParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
});

// The new order: every image id of the venue, exactly once. The first one becomes the cover.
export const reorderImagesSchema = z.object({
  imageIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(MAX_IMAGES_PER_VENUE)
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Each image id may appear only once' }),
});

export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;