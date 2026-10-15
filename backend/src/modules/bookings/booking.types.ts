export type BookingStatus = 'confirmed' | 'cancelled';

// A booking row joined with its slot, venue and customer (snake_case, as the database returns it)
export type BookingRow = {
  id: number;
  slot_id: number;
  customer_id: number;
  customer_name: string;
  status: BookingStatus;
  price_pkr: number;
  created_at: Date;
  cancelled_at: Date | null;
  starts_at: Date;
  ends_at: Date;
  venue_id: number;
  venue_name: string;
  venue_city: string;
  venue_owner_id: number;
};

// What the API returns (camelCase, grouped so the frontend can show a card without extra requests)
export type Booking = {
  id: number;
  slotId: number;
  status: BookingStatus;
  pricePkr: number; // the price at the moment of booking, later slot price changes do not affect it
  createdAt: Date;
  cancelledAt: Date | null;
  customer: { id: number; name: string };
  slot: { startsAt: Date; endsAt: Date };
  venue: { id: number; name: string; city: string; ownerId: number };
};
