import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/layout/role-guard';

// Every page inside the (customer) folder is only for customers
export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <RoleGuard allow={['customer']}>{children}</RoleGuard>
    </main>
  );
}