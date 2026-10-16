// Raw rows from the aggregate queries (snake_case). Counts are cast to int in SQL; sums come back
// from `pg` as strings (bigint), so the mapper converts them to numbers.
export type SummaryRow = {
  venues: number;
  active_venues: number;
  total_slots: number;
  booked_slots: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  upcoming_bookings: number;
  revenue: string;
};

export type VenueStatsRow = {
  venue_id: number;
  venue_name: string;
  total_slots: number;
  booked_slots: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  revenue: string;
};

export type MonthRow = { month: string; bookings: number; revenue: string };
export type WeekdayRow = { isodow: number; bookings: number };
export type RoleCountRow = { role: string; total: number };

// What the API returns (camelCase)
export type Summary = {
  venues: number;
  activeVenues: number;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number; // percent of slots that hold a confirmed booking, 0 when there are no slots
  confirmedBookings: number;
  cancelledBookings: number;
  upcomingBookings: number; // confirmed bookings whose slot has not started yet
  revenuePkr: number; // sum of the price saved on CONFIRMED bookings
};

export type VenueStats = {
  venueId: number;
  venueName: string;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number;
  confirmedBookings: number;
  cancelledBookings: number;
  revenuePkr: number;
};

export type MonthStats = { month: string; bookings: number; revenuePkr: number };
export type WeekdayStats = { weekday: number; name: string; bookings: number };
