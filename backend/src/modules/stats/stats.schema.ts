import { z } from 'zod';

const isoDateTime = z.iso.datetime({ offset: true });

// Optional period. It filters on WHEN THE SLOT HAPPENS (starts_at): from is included, to is excluded.
export const statsQuerySchema = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
});

export type StatsQuery = z.infer<typeof statsQuerySchema>;
