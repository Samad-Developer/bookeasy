# BookEasy

A venue booking REST API. Owners list venues and time slots, customers book them, and admins manage users, venues and bookings.

Request 
→ trace id 
→ logger 
→ helmet 
→ CORS 
→ json parser 
→ routes (+ rate limiter on login/signup) 
→ ... 
→ error handler

**Stack:** Node.js, Express, TypeScript, PostgreSQL, Zod, JWT
**Architecture:** Request → Validation (Zod) → Controller → Service → Repository → PostgreSQL → central error handler

## Hard problems and how I solved them

Both problems are enforced **in the database**, not only in application code. Application checks can race; database constraints cannot.

### 1. Race condition: two customers book the same slot at the same moment

**Problem.** The obvious flow is "check if the slot is free, then insert". Two simultaneous requests both pass the check, both insert, and the slot is double booked.

**Solution.** A partial unique index allows only one *confirmed* booking per slot:

```sql
CREATE UNIQUE INDEX bookings_one_active_per_slot
  ON bookings (slot_id) WHERE status = 'confirmed';
```

Postgres checks this atomically. One insert wins; the other fails with error `23505`, which the service turns into `409 SLOT_ALREADY_BOOKED`. Cancelled bookings are ignored by the index, so a cancelled slot can be booked again.

**Verified.** 10 parallel booking requests for one slot returned 1 × `201` and 9 × `409`.

### 2. Overlapping slots: one venue with two slots at the same time

**Problem.** An owner could create 10:00–11:00 and 10:30–11:30 for the same venue. Two different slots would cover the same time, so the venue could be booked twice for the same hour.

**Solution.** An exclusion constraint:

```sql
ALTER TABLE venue_slots
  ADD CONSTRAINT venue_slots_no_overlap
  EXCLUDE USING gist (venue_id WITH =, tstzrange(starts_at, ends_at) WITH &&);
```

Meaning: two rows may not have the **same `venue_id`** and **overlapping time ranges** (`&&` means "overlaps"). Different venues may share times, and back-to-back slots (10:00–11:00, then 11:00–12:00) are allowed because a range includes its start but not its end. A violation is error `23P01`, returned as `409 SLOT_OVERLAP`. It needs the `btree_gist` extension so `=` on `venue_id` can live in a GiST index.

## Other features

- JWT access tokens plus rotating, hashed refresh tokens in httpOnly cookies; roles: customer, owner, admin
- Ranked full-text venue search (generated `tsvector` column with a GIN index)
- Owner and platform statistics (revenue, occupancy, monthly trends) using SQL aggregates
- Consistent response envelope with a trace ID on every response
- Postman collections for every module, run with newman
