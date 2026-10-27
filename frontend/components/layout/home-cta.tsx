'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { roleHome } from '@/lib/routes';

const STAFF_CTA = {
  owner: 'Open my dashboard',
  admin: 'Open admin',
} as const;

// The buttons on the home page change with the visitor: guest, customer, owner or admin
export function HomeCta() {
  const { status, user } = useAuth();

  return (
    // min-h keeps the page from jumping while we find out whether the visitor is logged in
    <div className="mt-8 flex min-h-10 flex-wrap gap-3">
      {status === 'guest' && (
        <>
          <Link href="/venues" className={buttonVariants({ size: 'lg' })}>
            Browse venues
          </Link>
          <Link href="/signup" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            Create an account
          </Link>
        </>
      )}

      {status === 'authenticated' && user?.role === 'customer' && (
        <>
          <Link href="/venues" className={buttonVariants({ size: 'lg' })}>
            Browse venues
          </Link>
          <Link href="/bookings" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            My bookings
          </Link>
        </>
      )}

      {status === 'authenticated' && user && user.role !== 'customer' && (
        <Link href={roleHome[user.role]} className={buttonVariants({ size: 'lg' })}>
          {STAFF_CTA[user.role]}
        </Link>
      )}
    </div>
  );
}