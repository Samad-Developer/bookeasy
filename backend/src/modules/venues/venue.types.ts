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
};