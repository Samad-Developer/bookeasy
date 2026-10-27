// Matches booking.types.ts in the backend. Dates arrive as strings (JSON has no Date type).

export type BookingStatus = 'confirmed' | 'cancelled';

export type Booking = {
  id: number;
  slotId: number;
  status: BookingStatus;
  pricePkr: number; // the price at the moment of booking
  createdAt: string;
  cancelledAt: string | null;
  customer: { id: number; name: string };
  slot: { startsAt: string; endsAt: string };
  venue: { id: number; name: string; city: string; ownerId: number };
};

// The filter on the "My bookings" page. undefined = show everything.
export type BookingFilter = BookingStatus | undefined;