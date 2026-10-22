import { Suspense, type ReactNode } from 'react';
import { GuestOnly } from '@/components/layout/guest-only';

// Layout shared by /login and /signup.
// <Suspense> is required because GuestOnly and the forms read the URL (?next=...) in the browser.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Suspense>
        <GuestOnly>{children}</GuestOnly>
      </Suspense>
    </main>
  );
}