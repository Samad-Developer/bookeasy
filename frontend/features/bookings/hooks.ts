import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cancelBooking, createBooking, listMyBookings } from '@/features/bookings/api';
import type { BookingFilter } from '@/features/bookings/types';
import { useAuth } from '@/features/auth/use-auth';
import { venueKeys } from '@/features/venues/hooks';
import { getErrorMessage } from '@/lib/api-client';

export const bookingKeys = {
  all: ['bookings'] as const,
  // the user id is part of the key, so one person's list can never be shown to another person
  mine: (userId: number | undefined, status: BookingFilter, page: number) =>
    ['bookings', 'mine', userId, { status, page }] as const,
};

export function useMyBookings(status: BookingFilter, page: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: bookingKeys.mine(user?.id, status, page),
    queryFn: () => listMyBookings({ status, page }),
    enabled: !!user,
    placeholderData: keepPreviousData, // while a new filter loads, keep showing the old list a moment
  });
}

export function useCreateBooking(venueId: number) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success('Booking confirmed', {
        action: { label: 'My bookings', onClick: () => router.push('/bookings') },
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not book this slot.'));
    },
    // onSettled runs on success AND failure. After a failure the slot list may be wrong
    // (someone else just took the slot), so we reload it either way.
    onSettled: (_data, error) => {
      void queryClient.invalidateQueries({ queryKey: venueKeys.allSlots(venueId) });
      if (!error) void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => toast.success('Booking cancelled'),
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not cancel this booking.'));
    },
    // success or failure, reload: after "already cancelled" our list was simply out of date
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      // the slot is free again, so every cached slot list is out of date
      void queryClient.invalidateQueries({ queryKey: ['venues'] });
      // owners and admins can cancel too: their booking lists and statistics are out of date as well
      void queryClient.invalidateQueries({ queryKey: ['owner'] });
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}