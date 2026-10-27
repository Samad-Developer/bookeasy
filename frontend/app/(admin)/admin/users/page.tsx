import type { Metadata } from 'next';
import { UsersManager } from '@/features/admin/components/users-manager';

export const metadata: Metadata = { title: 'Users | BookEasy' };

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
      <UsersManager />
    </div>
  );
}