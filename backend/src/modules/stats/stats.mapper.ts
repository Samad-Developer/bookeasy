import type {
  MonthRow,
  MonthStats,
  Summary,
  SummaryRow,
  VenueStats,
  VenueStatsRow,
} from './stats.types.ts';

// 12 of 16 slots booked -> 75. One decimal, and 0 when there is nothing to divide by.
export const occupancyRate = (booked: number, total: number) =>
  total === 0 ? 0 : Math.round((booked / total) * 1000) / 10;

// `pg` returns bigint sums as strings so they cannot overflow a JS number silently.
// Our totals are far below 2^53, so Number() is safe here.
const pkr = (value: string) => Number(value);

export const toSummary = (row: SummaryRow): Summary => ({
  venues: row.venues,
  activeVenues: row.active_venues,
  totalSlots: row.total_slots,
  bookedSlots: row.booked_slots,
  occupancyRate: occupancyRate(row.booked_slots, row.total_slots),
  confirmedBookings: row.confirmed_bookings,
  cancelledBookings: row.cancelled_bookings,
  upcomingBookings: row.upcoming_bookings,
  revenuePkr: pkr(row.revenue),
});

export const toVenueStats = (row: VenueStatsRow): VenueStats => ({
  venueId: row.venue_id,
  venueName: row.venue_name,
  totalSlots: row.total_slots,
  bookedSlots: row.booked_slots,
  occupancyRate: occupancyRate(row.booked_slots, row.total_slots),
  confirmedBookings: row.confirmed_bookings,
  cancelledBookings: row.cancelled_bookings,
  revenuePkr: pkr(row.revenue),
});

export const toMonthStats = (row: MonthRow): MonthStats => ({
  month: row.month,
  bookings: row.bookings,
  revenuePkr: pkr(row.revenue),
});
