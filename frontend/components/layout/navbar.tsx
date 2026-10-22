'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/features/auth/use-auth';
import { roleNavLinks } from '@/lib/routes';

export function Navbar() {
  const { status, user } = useAuth();
  const logout = useLogout();

  return (
    <header className="border-b">
      <nav aria-label="Main" className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          BookEasy
        </Link>

        <div className="flex items-center gap-1">
          {status === 'loading' && <div aria-hidden className="h-8 w-36 animate-pulse rounded-md bg-muted" />}

          {status === 'guest' && (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants()}>
                Sign up
              </Link>
            </>
          )}

          {status === 'authenticated' && user && (
            <>
              {roleNavLinks[user.role].map((link) => (
                <Link key={link.href} href={link.href} className={buttonVariants({ variant: 'ghost' })}>
                  {link.label}
                </Link>
              ))}
              <span className="hidden px-2 text-sm text-muted-foreground sm:inline">{user.name}</span>
              <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
                Log out
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}