-- Up Migration

-- Postgres does NOT index foreign keys automatically. Statistics and "does this slot have bookings?"
-- checks join bookings to slots, and the partial unique index only covers CONFIRMED rows.
CREATE INDEX bookings_slot_idx ON bookings (slot_id);

-- Down Migration

DROP INDEX bookings_slot_idx;