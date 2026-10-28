// A row exactly as it comes from the database (snake_case)
export type VenueImageRow = {
  id: number;
  venue_id: number;
  url: string;
  storage_key: string;
  thumb_url: string;
  thumb_key: string;
  position: number;
  created_at: Date;
};

// What the API returns to the frontend. The storage key is internal and never leaves the server.
export type VenueImage = {
  id: number;
  url: string; // full size
  thumbUrl: string; // small copy
  position: number;
};

// An image that is processed and ready to be stored
export type ProcessedImage = {
  full: Buffer;
  thumb: Buffer;
  contentType: string;
};