-- Up Migration

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','owner','admin')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE venues (
  id          SERIAL PRIMARY KEY,
  owner_id    INTEGER NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  city        TEXT NOT NULL,
  address     TEXT NOT NULL,
  capacity    INTEGER NOT NULL CHECK (capacity > 0),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  search      TSVECTOR GENERATED ALWAYS AS (
                to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
              ) STORED
);

CREATE TABLE venue_slots (
  id          SERIAL PRIMARY KEY,
  venue_id    INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  price_pkr   INTEGER NOT NULL CHECK (price_pkr >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  UNIQUE (venue_id, starts_at)
);

CREATE TABLE bookings (
  id           SERIAL PRIMARY KEY,
  slot_id      INTEGER NOT NULL REFERENCES venue_slots(id),
  customer_id  INTEGER NOT NULL REFERENCES users(id),
  status       TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  price_pkr    INTEGER NOT NULL CHECK (price_pkr >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);

-- THE double-booking rule: at most one CONFIRMED booking per slot
CREATE UNIQUE INDEX bookings_one_active_per_slot ON bookings (slot_id) WHERE status = 'confirmed';

CREATE INDEX venues_owner_idx         ON venues (owner_id);
CREATE INDEX venues_city_category_idx ON venues (city, category);
CREATE INDEX venues_search_idx        ON venues USING gin (search);
CREATE INDEX slots_venue_start_idx    ON venue_slots (venue_id, starts_at);
CREATE INDEX bookings_customer_idx    ON bookings (customer_id, created_at DESC);

-- Down Migration

DROP TABLE IF EXISTS bookings, venue_slots, venues, refresh_tokens, users CASCADE;