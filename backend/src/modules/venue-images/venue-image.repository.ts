import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.ts';
import { toVenueImage } from './venue-image.mapper.ts';
import type { VenueImage, VenueImageRow } from './venue-image.types.ts';

type Db = Pool | PoolClient;

const IMAGE_COLUMNS = 'id, venue_id, url, storage_key, thumb_url, thumb_key, position, created_at';

// In display order: the first one is the cover
export async function findImagesOfVenue(venueId: number, db: Db = pool): Promise<VenueImage[]> {
  const { rows } = await db.query<VenueImageRow>(
    `SELECT ${IMAGE_COLUMNS} FROM venue_images WHERE venue_id = $1 ORDER BY position, id`,
    [venueId],
  );
  return rows.map(toVenueImage);
}

// This one keeps the storage key because the service needs it to delete the file
export async function findImageRow(venueId: number, imageId: number, db: Db = pool) {
  const { rows } = await db.query<VenueImageRow>(
    `SELECT ${IMAGE_COLUMNS} FROM venue_images WHERE venue_id = $1 AND id = $2`,
    [venueId, imageId],
  );
  return rows[0];
}

export async function countImagesOfVenue(venueId: number, db: Db = pool) {
  const { rows } = await db.query<{ total: number }>(
    'SELECT count(*)::int AS total FROM venue_images WHERE venue_id = $1',
    [venueId],
  );
  return rows[0].total;
}

// Locks the venue row until the transaction ends, so two uploads at the same moment
// cannot both pass the "maximum 8 photos" check
export async function lockVenue(venueId: number, db: PoolClient) {
  await db.query('SELECT id FROM venues WHERE id = $1 FOR UPDATE', [venueId]);
}

export async function insertImages(
  venueId: number,
  images: { url: string; storageKey: string; thumbUrl: string; thumbKey: string }[],
  db: Db = pool,
) {
  // New photos go after the existing ones
  const { rows } = await db.query<{ next: number }>(
    'SELECT coalesce(max(position) + 1, 0)::int AS next FROM venue_images WHERE venue_id = $1',
    [venueId],
  );
  const first = rows[0].next;

  for (const [index, image] of images.entries()) {
    await db.query(
      `INSERT INTO venue_images (venue_id, url, storage_key, thumb_url, thumb_key, position)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [venueId, image.url, image.storageKey, image.thumbUrl, image.thumbKey, first + index],
    );
  }
}

export async function deleteImageById(imageId: number, db: Db = pool) {
  await db.query('DELETE FROM venue_images WHERE id = $1', [imageId]);
}

// Position becomes the index in the given list: [7, 3, 9] -> 7 gets 0, 3 gets 1, 9 gets 2
export async function setOrder(venueId: number, imageIds: number[], db: Db = pool) {
  await db.query(
    `UPDATE venue_images AS vi
     SET position = ordered.position
     FROM (SELECT id, (ordinality - 1)::int AS position FROM unnest($2::int[]) WITH ORDINALITY AS t(id, ordinality)) AS ordered
     WHERE vi.id = ordered.id AND vi.venue_id = $1`,
    [venueId, imageIds],
  );
}