import { Suspense, type ReactNode } from 'react';
import { RoleGuard } from '@/components/layout/role-guard';
import { PageSpinner } from '@/components/shared/page-spinner';
import { OwnerNav } from '@/features/owner/components/owner-nav';

// Every page inside the (owner) folder is only for venue owners.
// <Suspense> is needed because RoleGuard and OwnerNav read the current URL, and some owner pages
// have a dynamic part in the URL (/owner/venues/[id]): Next must know what to show while that part is unknown.
export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Suspense fallback={<PageSpinner />}>
        <RoleGuard allow={['owner']}>
          <OwnerNav />
          {children}
        </RoleGuard>
      </Suspense>
    </main>
  );
}