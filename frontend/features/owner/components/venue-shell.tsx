'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { createContext, useContext, type ReactNode } from 'react';
import { toast } from 'sonner';
import { PageSpinner } from '@/components/shared/page-spinner';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { useManagedVenue, useUpdateVenue } from '@/features/owner/hooks';
import type { VenueDetail } from '@/features/venues/types';
import { ApiError, getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// The pages inside /owner/venues/[id] all need the venue, so the shell loads it ONCE
// and hands it down. Any page below can call useManagedVenueContext().
const VenueContext = createContext<VenueDetail | null>(null);

export function useManagedVenueContext() {
  const venue = useContext(VenueContext);
  if (!venue) throw new Error('useManagedVenueContext must be used inside <VenueShell>');
  return venue;
}

export function useVenueIdFromUrl() {
  const { id } = useParams<{ id: string }>();
  return /^\d+$/.test(id) && Number(id) >= 1 && Number(id) <= 2_147_483_647 ? Number(id) : null;
}

export function VenueShell({ children }: { children: ReactNode }) {
  const venueId = useVenueIdFromUrl();
  const { user } = useAuth();
  const { data: venue, isPending, isError, error, refetch } = useManagedVenue(venueId);

  if (venueId === null) return <Problem title="Venue not found" text="The link is wrong." />;
  if (isPending) return <PageSpinner />;

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <Problem title="Venue not found" text="It may have been removed, or the link is wrong." />;
    }
    return (
      <div role="alert" className="max-w-md space-y-3 py-4">
        <p className="text-destructive">{getErrorMessage(error, 'Could not load this venue.')}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  // The API shows a venue to anyone, but only its owner may change it (the API enforces that too)
  if (venue.ownerId !== user?.id) {
    return <Problem title="This is not your venue" text="You can only manage venues you listed." />;
  }

  return (
    <VenueContext.Provider value={venue}>
      <VenueHeader venue={venue} />
      {children}
    </VenueContext.Provider>
  );
}

function Problem({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-md space-y-3 py-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      <Link href="/owner/venues" className={buttonVariants({ variant: 'outline' })}>
        Back to my venues
      </Link>
    </div>
  );
}

function VenueHeader({ venue }: { venue: VenueDetail }) {
  const pathname = usePathname();
  const update = useUpdateVenue(venue.id);
  const base = `/owner/venues/${venue.id}`;

  const tabs = [
    { href: `${base}/slots`, label: 'Slots' },
    { href: `${base}/bookings`, label: 'Bookings' },
    { href: base, label: 'Details' },
  ];

  function toggleVisible() {
    update.mutate(
      { isActive: !venue.isActive },
      {
        onSuccess: () => toast.success(venue.isActive ? 'Venue hidden from customers' : 'Venue is visible to customers again'),
        onError: (error) => toast.error(getErrorMessage(error, 'Could not change the venue.')),
      },
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <Link href="/owner/venues" className="inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">
        My venues
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-tight">
            {venue.name}
            {!venue.isActive && (
              <span className="rounded-full border px-2.5 py-0.5 text-xs font-normal text-muted-foreground">Hidden</span>
            )}
          </h1>
          {!venue.isActive && (
            <p className="text-sm text-muted-foreground">Customers cannot see this venue. Show it again when you are ready.</p>
          )}
        </div>

        <div className="flex gap-2">
          {venue.isActive && (
            <Link href={`/venues/${venue.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              View public page
            </Link>
          )}
          <Button variant="outline" size="sm" disabled={update.isPending} onClick={toggleVisible}>
            {venue.isActive ? 'Hide venue' : 'Show venue'}
          </Button>
        </div>
      </div>

      <nav aria-label="Venue sections" className="flex gap-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(buttonVariants({ variant: active ? 'secondary' : 'ghost', size: 'sm' }))}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}