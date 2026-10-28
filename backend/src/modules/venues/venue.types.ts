// A row exactly as it comes from the database (snake_case)
export type VenueRow = {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  category: string;
  city: string;
  address: string;
  capacity: number;
  is_active: boolean;
  created_at: Date;
  cover_image_url: string | null;
  cover_thumb_url: string | null;
  image_count: number;
};

// What the API returns to the frontend (camelCase)
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
  createdAt: Date;
  coverImageUrl: string | null; // the first photo (full size), null when the venue has none
  coverThumbUrl: string | null; // the same photo, small: use this one on cards and lists
  imageCount: number;
};