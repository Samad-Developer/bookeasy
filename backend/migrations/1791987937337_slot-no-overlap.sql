-- Up Migration

-- Lets a GiST index understand plain "=" on integers (needed for venue_id WITH =)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Two slots of the SAME venue may never share any time.
-- tstzrange(a, b) is "from a up to (but not including) b", so 10:00-11:00 and 11:00-12:00 are allowed.
ALTER TABLE venue_slots
  ADD CONSTRAINT venue_slots_no_overlap
  EXCLUDE USING gist (venue_id WITH =, tstzrange(starts_at, ends_at) WITH &&);

-- The exclusion constraint already covers "same venue + same start", so the old rule is redundant
ALTER TABLE venue_slots DROP CONSTRAINT venue_slots_venue_id_starts_at_key;

-- Down Migration

ALTER TABLE venue_slots ADD CONSTRAINT venue_slots_venue_id_starts_at_key UNIQUE (venue_id, starts_at);
ALTER TABLE venue_slots DROP CONSTRAINT venue_slots_no_overlap;