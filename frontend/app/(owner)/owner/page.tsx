import type { Metadata } from 'next';
import { StatsDashboard } from '@/features/owner/components/stats-dashboard';

export const metadata: Metadata = { title: 'Dashboard | BookEasy' };

export default function OwnerDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <StatsDashboard />
    </div>
  );
}