'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { PageSpinner } from '@/components/shared/page-spinner';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { roleHome } from '@/lib/routes';
import type { Role } from '@/types/api';

// Wrap a page group with <RoleGuard allow={['owner']}> to protect it.
//   not logged in      -> sent to /login?next=<this page>
//   wrong role         -> "no permission" message (the user IS logged in, so no login redirect)
//   allowed role       -> the page
//
// IMPORTANT: this only decides what the user SEES. Anyone can open devtools and change it.
// The real protection is requireRole() in the Express API: it answers 403 to the wrong role.
export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'guest') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  // 'loading' (asking the API) or 'guest' (about to be redirected)
  if (status !== 'authenticated' || !user) return <PageSpinner />;

  if (!allow.includes(user.role)) {
    return (
      <div className="max-w-md space-y-3 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">You do not have access to this page</h1>
        <p className="text-muted-foreground">This page is for another type of account.</p>
        <Link href={roleHome[user.role]} className={buttonVariants({ variant: 'outline' })}>
          Go to my page
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}