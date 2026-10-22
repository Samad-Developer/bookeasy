import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/layout/role-guard';

// Every page inside the (owner) folder is only for venue owners
export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <RoleGuard allow={['owner']}>{children}</RoleGuard>
    </main>
  );
}