import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

// Shown when notFound() is called: the venue does not exist, or its owner switched it off
export default function VenueNotFound() {
  return (
    <div className="max-w-md space-y-3 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Venue not found</h1>
      <p className="text-muted-foreground">It may have been removed, or the link is wrong.</p>
      <Link href="/venues" className={buttonVariants({ variant: 'outline' })}>
        Browse all venues
      </Link>
    </div>
  );
}