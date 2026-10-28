import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/use-auth';
import type { BookingFilter } from '@/features/bookings/types';
import {
  createSlot,
  createVenue,
  deleteSlot,
  deleteVenueImage,
  getOwnerStats,
  listManagedSlots,
  listMyVenues,
  listVenueBookings,
  reorderVenueImages,
  updateSlotPrice,
  updateVenue,
  uploadVenueImages,
} from '@/features/owner/api';
import { getVenue } from '@/features/venues/api';
import { getErrorMessage } from '@/lib/api-client';

// Every owner query key starts with 'owner' and then the user id, so one owner's cache is never shown to another.
export const ownerKeys = {
  all: ['owner'] as const,
  stats: (userId: number | undefined) => ['owner', userId, 'stats'] as const,
  venues: (userId: number | undefined, page: number) => ['owner', userId, 'venues', page] as const,
  venue: (userId: number | undefined, venueId: number) => ['owner', userId, 'venue', venueId] as const,
  slots: (userId: number | undefined, venueId: number, page: number) => ['owner', userId, 'slots', venueId, page] as const,
  bookings: (userId: number | undefined, venueId: number, status: BookingFilter, page: number) =>
    ['owner', userId, 'bookings', venueId, { status, page }] as const,
};

// ── reading ─────────────────────────────────────────────────────────────────

export function useOwnerStats() {
  const { user } = useAuth();
  return useQuery({ queryKey: ownerKeys.stats(user?.id), queryFn: getOwnerStats, enabled: !!user });
}

export function useMyVenues(page: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ownerKeys.venues(user?.id, page),
    queryFn: () => listMyVenues(page),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

export function useManagedVenue(venueId: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ownerKeys.venue(user?.id, venueId ?? 0),
    queryFn: () => getVenue(venueId as number),
    enabled: !!user && venueId !== null,
  });
}

export function useManagedSlots(venueId: number, page: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ownerKeys.slots(user?.id, venueId, page),
    queryFn: () => listManagedSlots(venueId, page),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

export function useVenueBookings(venueId: number, status: BookingFilter, page: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ownerKeys.bookings(user?.id, venueId, status, page),
    queryFn: () => listVenueBookings(venueId, { status, page }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

// ── writing ─────────────────────────────────────────────────────────────────

// After ANY change the owner makes, three groups of cached data can be out of date:
// the owner pages, the public venue pages, and the customers' bookings. Reloading them all is simple and safe.
function useRefreshEverything() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ownerKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['venues'] });
    void queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };
}

export function useCreateVenue() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: createVenue,
    onSuccess: () => toast.success('Venue created'),
    onSettled: refresh,
  });
}

export function useUpdateVenue(venueId: number) {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: (changes: Parameters<typeof updateVenue>[1]) => updateVenue(venueId, changes),
    onSettled: refresh,
  });
}

export function useCreateSlot(venueId: number) {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: (input: Parameters<typeof createSlot>[1]) => createSlot(venueId, input),
    onSuccess: () => toast.success('Slot added'),
    onSettled: refresh,
  });
}

export function useUpdateSlotPrice() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: ({ slotId, pricePkr }: { slotId: number; pricePkr: number }) => updateSlotPrice(slotId, pricePkr),
    onSuccess: () => toast.success('Price updated'),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not change the price.')),
    onSettled: refresh,
  });
}

export function useDeleteSlot() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: deleteSlot,
    onSuccess: () => toast.success('Slot deleted'),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete this slot.')),
    onSettled: refresh,
  });
}

// ── photos ──────────────────────────────────────────────────────────────────
// The venue id is part of the variables (not of the hook), because on the "Add a venue" screen
// the id only exists AFTER the venue was created. The screens show their own success messages.

export function useUploadImages() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: ({ venueId, files }: { venueId: number; files: File[] }) => uploadVenueImages(venueId, files),
    onSettled: refresh,
  });
}

export function useDeleteImage() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: ({ venueId, imageId }: { venueId: number; imageId: number }) => deleteVenueImage(venueId, imageId),
    onSuccess: () => toast.success('Photo deleted'),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete this photo.')),
    onSettled: refresh,
  });
}

export function useReorderImages() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: ({ venueId, imageIds }: { venueId: number; imageIds: number[] }) => reorderVenueImages(venueId, imageIds),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not change the photo order.')),
    onSettled: refresh,
  });
}