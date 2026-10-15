// A row exactly as it comes from the database (snake_case)
export type SlotRow = {
  id: number;
  venue_id: number;
  starts_at: Date;
  ends_at: Date;
  price_pkr: number;
  created_at: Date;
  is_booked: boolean;
};

// What the API returns to the frontend (camelCase). Dates are sent as UTC ISO strings.
export type Slot = {
  id: number;
  venueId: number;
  startsAt: Date;
  endsAt: Date;
  pricePkr: number;
  createdAt: Date;
  isBooked: boolean; // true when a confirmed booking holds this slot
};
