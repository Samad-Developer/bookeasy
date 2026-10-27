// Matches stats.types.ts in the backend (GET /stats/owner).

export type OwnerSummary = {
  venues: number;
  activeVenues: number;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number; // percent, 0 when there are no slots
  confirmedBookings: number;
  cancelledBookings: number;
  upcomingBookings: number; // confirmed bookings whose slot has not started yet
  revenuePkr: number; // sum of the price saved on CONFIRMED bookings
};

export type OwnerVenueStats = {
  venueId: number;
  venueName: string;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number;
  confirmedBookings: number;
  cancelledBookings: number;
  revenuePkr: number;
};

export type OwnerMonthStats = { month: string; bookings: number; revenuePkr: number }; // month = "2026-11"

export type OwnerStats = {
  summary: OwnerSummary;
  venues: OwnerVenueStats[];
  byMonth: OwnerMonthStats[];
};