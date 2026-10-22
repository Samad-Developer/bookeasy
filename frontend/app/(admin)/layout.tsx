import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/layout/role-guard';

// Every page inside the (admin) folder is only for admins
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <RoleGuard allow={['admin']}>{children}</RoleGuard>
    </main>
  );
}