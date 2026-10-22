'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { roleHome } from '@/lib/routes';

const ROLE_CTA = {
  customer: 'Go to my bookings',
  owner: 'Open my dashboard',
  admin: 'Open admin',
} as const;

// The buttons on the home page change with the visitor: guest or logged in
export function HomeCta() {
  const { status, user } = useAuth();

  return (
    // min-h keeps the page from jumping while we find out whether the visitor is logged in
    <div className="mt-8 flex min-h-10 flex-wrap gap-3">
      {status === 'guest' && (
        <>
          <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
            Create an account
          </Link>
          <Link href="/login" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            Log in
          </Link>
        </>
      )}

      {status === 'authenticated' && user && (
        <Link href={roleHome[user.role]} className={buttonVariants({ size: 'lg' })}>
          {ROLE_CTA[user.role]}
        </Link>
      )}
    </div>
  );
}