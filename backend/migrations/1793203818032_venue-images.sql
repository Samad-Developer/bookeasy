-- Up Migration

-- One row per photo. The photo FILE lives in the storage bucket; the database only keeps its address.
CREATE TABLE venue_images (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  venue_id    INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,                 -- public address of the full-size photo (gallery)
  storage_key TEXT NOT NULL UNIQUE,          -- file name inside the bucket, needed to delete the file later
  thumb_url   TEXT NOT NULL,                 -- public address of the small copy (venue cards load this one: much lighter)
  thumb_key   TEXT NOT NULL UNIQUE,
  position    INTEGER NOT NULL DEFAULT 0,    -- 0, 1, 2 ... the photo with the lowest position is the cover
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "all photos of this venue, in order" and "the cover of this venue" both use this index
CREATE INDEX venue_images_venue_idx ON venue_images (venue_id, position, id);

-- Down Migration

DROP TABLE venue_images;