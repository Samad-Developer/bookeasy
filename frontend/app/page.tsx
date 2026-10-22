import { HomeCta } from '@/components/layout/home-cta';

// Simple home page for now. In Step 3 it shows real venues from the API.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Book the hall, marquee or lawn for your event.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        See which dates are open, compare prices in PKR and reserve a slot. Venue owners manage their calendar in one place.
      </p>
      <HomeCta />
    </main>
  );
}