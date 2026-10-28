// These match the backend: venue.schema.ts, venue.types.ts and slot.types.ts.
// Dates arrive as strings (JSON has no Date type).

export const VENUE_CATEGORIES = [
  'wedding_hall',
  'party_lawn',
  'conference_room',
  'meeting_room',
  'sports_arena',
  'studio',
  'other',
] as const;

export type VenueCategory = (typeof VENUE_CATEGORIES)[number];

const CATEGORY_LABELS: Record<VenueCategory, string> = {
  wedding_hall: 'Wedding hall',
  party_lawn: 'Party lawn',
  conference_room: 'Conference room',
  meeting_room: 'Meeting room',
  sports_arena: 'Sports arena',
  studio: 'Studio',
  other: 'Other',
};

// "wedding_hall" -> "Wedding hall". Unknown categories still show something readable.
export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category as VenueCategory] ?? category.replace(/_/g, ' ');
}

export type Venue = {
  id: number;
  ownerId: number;
  name: string;
  description: string;
  category: string;
  city: string;
  address: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  coverImageUrl: string | null; // the first photo, full size. null when the venue has no photos
  coverThumbUrl: string | null; // the same photo, small. Use this one on cards and lists
  imageCount: number;
};

export type VenueImage = {
  id: number;
  url: string; // full size
  thumbUrl: string; // small copy
  position: number; // 0 = cover
};

// GET /venues/:id also returns every photo (lists only return the cover)
export type VenueDetail = Venue & { images: VenueImage[] };

export type Slot = {
  id: number;
  venueId: number;
  startsAt: string;
  endsAt: string;
  pricePkr: number;
  createdAt: string;
  isBooked: boolean; // true when a confirmed booking holds this slot
};