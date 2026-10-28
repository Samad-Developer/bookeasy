import type { VenueImage, VenueImageRow } from './venue-image.types.ts';

export const toVenueImage = (row: VenueImageRow): VenueImage => ({
  id: row.id,
  url: row.url,
  thumbUrl: row.thumb_url,
  position: row.position,
});