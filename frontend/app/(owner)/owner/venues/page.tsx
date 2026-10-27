import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { MyVenues } from '@/features/owner/components/my-venues';

export const metadata: Metadata = { title: 'My venues | BookEasy' };

export default function MyVenuesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">My venues</h1>
        <Link href="/owner/venues/new" className={buttonVariants()}>
          Add a venue
        </Link>
      </div>
      <MyVenues />
    </div>
  );
}