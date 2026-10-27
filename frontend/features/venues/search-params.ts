import { VENUE_CATEGORIES, type VenueCategory } from '@/features/venues/types';

// The URL is typed by humans: /venues?page=abc&category=banana&city=x
// The API would answer 400 to values like these, so we clean them BEFORE calling it.
// Anything invalid is simply ignored.

export type VenueSearch = {
  q: string;
  city: string;
  category: VenueCategory | undefined;
  page: number;
};

export const EMPTY_SEARCH: VenueSearch = { q: '', city: '', category: undefined, page: 1 };

export type RawSearchParams = Record<string, string | string[] | undefined>;

// ?q=a&q=b gives an array in Next.js: we take the first value
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseVenueSearch(raw: RawSearchParams): VenueSearch {
  const q = (first(raw.q) ?? '').trim().slice(0, 100);

  let city = (first(raw.city) ?? '').trim().slice(0, 60);
  if (city.length < 2) city = ''; // the API requires at least 2 characters for a city

  const category = VENUE_CATEGORIES.find((value) => value === first(raw.category));

  const page = Number(first(raw.page));
  const safePage = Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : 1;

  return { q, city, category, page: safePage };
}

export const hasActiveFilters = (search: VenueSearch) => !!(search.q || search.city || search.category);