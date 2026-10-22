'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { PageSpinner } from '@/components/shared/page-spinner';
import { useAuth } from '@/features/auth/use-auth';
import { useNextPath } from '@/features/auth/use-next-path';
import { roleHome } from '@/lib/routes';

// Wraps the login and signup pages.
//   guest         -> show the form
//   logged in     -> leave: go to ?next=... if present, otherwise to the role's home page
// This is also what sends the user onward right after a successful login.
export function GuestOnly({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const next = useNextPath();

  useEffect(() => {
    if (status === 'authenticated' && user) router.replace(next ?? roleHome[user.role]);
  }, [status, user, next, router]);

  if (status !== 'guest') return <PageSpinner />;
  return <>{children}</>;
}