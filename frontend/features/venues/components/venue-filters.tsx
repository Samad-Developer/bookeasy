import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hasActiveFilters, type VenueSearch } from '@/features/venues/search-params';
import { categoryLabel, VENUE_CATEGORIES } from '@/features/venues/types';

// A plain HTML form with method="get": pressing Search just opens /venues?q=...&city=...
// No JavaScript state, and the result page has a URL you can share, bookmark, or press Back on.
export function VenueFilters({ search }: { search: VenueSearch }) {
  return (
    <form
      // a new key makes React rebuild the form when the URL changes, so "Clear" really empties the inputs
      key={`${search.q}|${search.city}|${search.category ?? ''}`}
      action="/venues"
      method="get"
      role="search"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="q">Search</Label>
        <Input id="q" name="q" type="search" defaultValue={search.q} placeholder="Marquee, lawn, hall…" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={search.city} placeholder="Islamabad" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Type</Label>
        <select
          id="category"
          name="category"
          defaultValue={search.category ?? ''}
          className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All types</option>
          {VENUE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Search</Button>
        {hasActiveFilters(search) && (
          <Link href="/venues" className={buttonVariants({ variant: 'ghost' })}>
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}