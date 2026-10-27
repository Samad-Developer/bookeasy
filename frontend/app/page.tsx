import { Suspense } from 'react';
import { HomeCta } from '@/components/layout/home-cta';
import { FeaturedVenues } from '@/features/venues/components/featured-venues';

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Book the hall, marquee or lawn for your event.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        See which dates are open, compare prices in PKR and reserve a slot. Venue owners manage their calendar in one place.
      </p>
      <HomeCta />

      {/* fetches the newest venues on the server; shows nothing while loading or if the API is down */}
      <Suspense fallback={null}>
        <FeaturedVenues />
      </Suspense>
    </main>
  );
}