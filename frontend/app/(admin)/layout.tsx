import { Suspense, type ReactNode } from 'react';
import { RoleGuard } from '@/components/layout/role-guard';
import { PageSpinner } from '@/components/shared/page-spinner';
import { AdminNav } from '@/features/admin/components/admin-nav';

// Every page inside the (admin) folder is only for admins.
// <Suspense> because RoleGuard and AdminNav read the current URL (see the note in the owner layout).
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Suspense fallback={<PageSpinner />}>
        <RoleGuard allow={['admin']}>
          <AdminNav />
          {children}
        </RoleGuard>
      </Suspense>
    </main>
  );
}