import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listSlots } from '@/features/venues/api';

// Query keys name the cached data. Same key = same cache entry.
export const venueKeys = {
  // the start of every slot key of one venue: invalidating this reloads both the "all" and the "available only" lists
  allSlots: (venueId: number) => ['venues', venueId, 'slots'] as const,
  slots: (venueId: number, availableOnly: boolean) => ['venues', venueId, 'slots', { availableOnly }] as const,
};

export function useVenueSlots(venueId: number, availableOnly: boolean) {
  return useQuery({
    queryKey: venueKeys.slots(venueId, availableOnly),
    queryFn: () => listSlots(venueId, { availableOnly }),
    staleTime: 10_000, // availability changes quickly: after 10 seconds the data is "old"
    refetchOnWindowFocus: true, // so coming back to the tab refreshes it
    placeholderData: keepPreviousData, // when the checkbox changes, keep showing the old list until the new one arrives
  });
}