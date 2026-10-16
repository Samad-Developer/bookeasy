import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.ts';
import {
  toMonthStats,
  toSummary,
  toVenueStats,
} from './stats.mapper.ts';
import type {
  MonthRow,
  RoleCountRow,
  SummaryRow,
  VenueStatsRow,
  WeekdayRow,
} from './stats.types.ts';

type Db = Pool | PoolClient;

// Days and months are counted in Pakistan time, not UTC. A slot at 20:00 UTC on the 31st is already
// the 1st in Pakistan, and the owner thinks in Pakistan days.
const BUSINESS_TIMEZONE = 'Asia/Karachi';

// ownerId set  -> one owner's venues. ownerId missing -> the whole platform.
// from / to    -> only slots that START inside the period.
export type Scope = { ownerId?: number; from?: string; to?: string };

function buildScope(scope: Scope) {
  const params: unknown[] = [];
  const venueConditions: string[] = [];
  const slotConditions: string[] = [];

  if (scope.ownerId !== undefined) {
    params.push(scope.ownerId);
    venueConditions.push(`v.owner_id = $${params.length}`);
  }
  if (scope.from) {
    params.push(scope.from);
    slotConditions.push(`s.starts_at >= $${params.length}`);
  }
  if (scope.to) {
    params.push(scope.to);
    slotConditions.push(`s.starts_at < $${params.length}`);
  }

  return {
    params,
    venueWhere: venueConditions.length ? `WHERE ${venueConditions.join(' AND ')}` : '',
    // These go inside "JOIN ... ON", NOT in WHERE. In a WHERE they would delete venues that have no slot
    // in the period, and those venues must still appear (with zeros).
    slotOn: slotConditions.map((condition) => ` AND ${condition}`).join(''),
  };
}

// FROM venues, then every slot, then every booking of that slot (cancelled ones too)
const fromAllRows = (slotOn: string) => `
  FROM venues v
  LEFT JOIN venue_slots s ON s.venue_id = v.id${slotOn}
  LEFT JOIN bookings b ON b.slot_id = s.id`;

  // Only confirmed bookings are real business, so these two use inner joins and skip cancelled ones
const fromConfirmedRows = (slotOn: string) => `
  FROM venues v
  JOIN venue_slots s ON s.venue_id = v.id${slotOn}
  JOIN bookings b ON b.slot_id = s.id AND b.status = 'confirmed'`;
  
export async function getSummary(scope: Scope, db: Db = pool) {
  const { params, venueWhere, slotOn } = buildScope(scope);
  const { rows } = await db.query<SummaryRow>(
    `SELECT
       count(DISTINCT v.id)::int                                                        AS venues,
       count(DISTINCT v.id) FILTER (WHERE v.is_active)::int                             AS active_venues,
       count(DISTINCT s.id)::int                                                        AS total_slots,
       count(DISTINCT s.id) FILTER (WHERE b.status = 'confirmed')::int                  AS booked_slots,
       count(b.id) FILTER (WHERE b.status = 'confirmed')::int                           AS confirmed_bookings,
       count(b.id) FILTER (WHERE b.status = 'cancelled')::int                           AS cancelled_bookings,
       count(b.id) FILTER (WHERE b.status = 'confirmed' AND s.starts_at > now())::int   AS upcoming_bookings,
       coalesce(sum(b.price_pkr) FILTER (WHERE b.status = 'confirmed'), 0)::bigint      AS revenue
     ${fromAllRows(slotOn)}
     ${venueWhere}`,
    params,
  );
  return toSummary(rows[0]);
}

export async function getVenueBreakdown(scope: Scope, limit?: number, db: Db = pool) {
  const { params, venueWhere, slotOn } = buildScope(scope);

  // limit is only for platform stats, not owner stats. The owner always gets the full list of their venues.
  let limitSql = '';
  if (limit !== undefined) {
    params.push(limit);
    limitSql = `LIMIT $${params.length}`;
  }

  const { rows } = await db.query<VenueStatsRow>(
    `SELECT
       v.id   AS venue_id,
       v.name AS venue_name,
       count(DISTINCT s.id)::int                                                   AS total_slots,
       count(DISTINCT s.id) FILTER (WHERE b.status = 'confirmed')::int             AS booked_slots,
       count(b.id) FILTER (WHERE b.status = 'confirmed')::int                      AS confirmed_bookings,
       count(b.id) FILTER (WHERE b.status = 'cancelled')::int                      AS cancelled_bookings,
       coalesce(sum(b.price_pkr) FILTER (WHERE b.status = 'confirmed'), 0)::bigint AS revenue
     ${fromAllRows(slotOn)}
     ${venueWhere}
     GROUP BY v.id, v.name
     ORDER BY revenue DESC, confirmed_bookings DESC, v.id
     ${limitSql}`,
    params,
  );
  return rows.map(toVenueStats);
}

export async function getMonthly(scope: Scope, db: Db = pool) {
  const { params, venueWhere, slotOn } = buildScope(scope);
  params.push(BUSINESS_TIMEZONE);
  const tz = `$${params.length}`;
  const { rows } = await db.query<MonthRow>(
    `SELECT
       to_char(s.starts_at AT TIME ZONE ${tz}, 'YYYY-MM') AS month,
       count(*)::int                                      AS bookings,
       sum(b.price_pkr)::bigint                           AS revenue
     ${fromConfirmedRows(slotOn)}
     ${venueWhere}
     GROUP BY month
     ORDER BY month`,
    params,
  );
  return rows.map(toMonthStats);
}

export async function getWeekdays(scope: Scope, db: Db = pool) {
  const { params, venueWhere, slotOn } = buildScope(scope);

  params.push(BUSINESS_TIMEZONE);
  const tz = `$${params.length}`;
  
  const { rows } = await db.query<WeekdayRow>(
    `SELECT
       extract(isodow FROM s.starts_at AT TIME ZONE ${tz})::int AS isodow,
       count(*)::int                                            AS bookings
     ${fromConfirmedRows(slotOn)}
     ${venueWhere}
     GROUP BY isodow`,
    params,
  );
  return rows;
}

export async function getUserCountsByRole(db: Db = pool) {
  const { rows } = await db.query<RoleCountRow>(
    `SELECT role, count(*)::int AS total FROM users GROUP BY role ORDER BY role`,
  );
  return rows;
}
