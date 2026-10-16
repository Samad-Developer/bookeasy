import { AppError } from '../../shared/errors/app-error.ts';
import * as repo from './stats.repository.ts';
import type { Scope } from './stats.repository.ts';
import type { StatsQuery } from './stats.schema.ts';
import type { WeekdayRow } from './stats.types.ts';

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function assertValidPeriod(query: StatsQuery) {
  if (query.from && query.to && new Date(query.from) >= new Date(query.to)) {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'from must be earlier than to', [
      { field: 'to', issue: 'to must be later than from' },
    ]);
  }
}

// The database only returns weekdays that have bookings. Charts want all seven, so we add the zeros.
function fillWeekdays(rows: WeekdayRow[]) {
  return WEEKDAY_NAMES.map((name, index) => ({
    weekday: index + 1, // 1 = Monday ... 7 = Sunday
    name,
    bookings: rows.find((row) => row.isodow === index + 1)?.bookings ?? 0,
  }));
}

// The four queries do not depend on each other, so they run at the same time
async function buildDashboard(scope: Scope) {
  const [summary, venues, byMonth, weekdayRows] = await Promise.all([
    repo.getSummary(scope),
    repo.getVenueBreakdown(scope),
    repo.getMonthly(scope),
    repo.getWeekdays(scope),
  ]);
  return { summary, venues, byMonth, byWeekday: fillWeekdays(weekdayRows) };
}

export async function getOwnerStats(ownerId: number, query: StatsQuery) {
  assertValidPeriod(query);
  return buildDashboard({ ownerId, from: query.from, to: query.to });
}

export async function getPlatformStats(query: StatsQuery) {
  assertValidPeriod(query);
  const scope: Scope = { from: query.from, to: query.to };
  const [dashboard, topVenues, usersByRole] = await Promise.all([
    buildDashboard(scope),
    repo.getVenueBreakdown(scope, 5),
    repo.getUserCountsByRole(),
  ]);
  const { venues: _allVenues, ...rest } = dashboard; // the full per-venue list is for owners only
  return { ...rest, topVenues, usersByRole };
}
