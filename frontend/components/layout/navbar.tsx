'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/features/auth/use-auth';
import { roleNavLinks } from '@/lib/routes';
import { cn } from '@/lib/utils';

// Less side padding on phones, so "Venues + My bookings + Log out" fit on a 390px screen
const compact = 'px-2 sm:px-4';

export function Navbar() {
  const { status, user } = useAuth();
  const logout = useLogout();

  return (
    <header className="border-b">
      <nav aria-label="Main" className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/" className="mr-1 text-lg font-semibold tracking-tight">
            BookEasy
          </Link>
          <Link href="/venues" className={cn(buttonVariants({ variant: 'ghost' }), compact)}>
            Venues
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {status === 'loading' && <div aria-hidden className="h-8 w-36 animate-pulse rounded-md bg-muted" />}

          {status === 'guest' && (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), compact)}>
                Log in
              </Link>
              <Link href="/signup" className={cn(buttonVariants(), compact)}>
                Sign up
              </Link>
            </>
          )}

          {status === 'authenticated' && user && (
            <>
              {roleNavLinks[user.role].map((link) => (
                <Link key={link.href} href={link.href} className={cn(buttonVariants({ variant: 'ghost' }), compact)}>
                  {link.label}
                </Link>
              ))}
              <span className="hidden px-2 text-sm text-muted-foreground sm:inline">{user.name}</span>
              <Button variant="outline" className={compact} onClick={() => logout.mutate()} disabled={logout.isPending}>
                Log out
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}