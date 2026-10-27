import type { Metadata } from 'next';
import { PlatformStats } from '@/features/admin/components/platform-stats';

export const metadata: Metadata = { title: 'Admin | BookEasy' };

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
      <PlatformStats />
    </div>
  );
}