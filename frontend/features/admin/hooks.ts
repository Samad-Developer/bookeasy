import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listAllBookings, listAllVenues, listUsers, getPlatformStats, setVenueActive, updateUser } from '@/features/admin/api';
import type { UserFilters, VenueFilters } from '@/features/admin/types';
import { useAuth } from '@/features/auth/use-auth';
import type { BookingFilter } from '@/features/bookings/types';
import { getErrorMessage } from '@/lib/api-client';

// Every admin query key starts with 'admin' and then the user id.
export const adminKeys = {
  all: ['admin'] as const,
  stats: (userId: number | undefined) => ['admin', userId, 'stats'] as const,
  users: (userId: number | undefined, filters: UserFilters, page: number) => ['admin', userId, 'users', filters, page] as const,
  venues: (userId: number | undefined, filters: VenueFilters, page: number) => ['admin', userId, 'venues', filters, page] as const,
  bookings: (userId: number | undefined, status: BookingFilter, page: number) => ['admin', userId, 'bookings', status, page] as const,
};

export function usePlatformStats() {
  const { user } = useAuth();
  return useQuery({ queryKey: adminKeys.stats(user?.id), queryFn: getPlatformStats, enabled: !!user });
}

export function useUsers(filters: UserFilters, page: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: adminKeys.users(user?.id, filters, page),
    queryFn: () => listUsers(filters, page),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

export function useAllVenues(filters: VenueFilters, page: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: adminKeys.venues(user?.id, filters, page),
    queryFn: () => listAllVenues(filters, page),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

export function useAllBookings(status: BookingFilter, page: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: adminKeys.bookings(user?.id, status, page),
    queryFn: () => listAllBookings(status, page),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

// An admin's change can make every other list out of date, so we reload them all.
function useRefreshEverything() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [['admin'], ['venues'], ['bookings'], ['owner']]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useUpdateUser() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Parameters<typeof updateUser>[1] }) => updateUser(id, changes),
    onSuccess: () => toast.success('User updated'),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update this user.')),
    onSettled: refresh,
  });
}

export function useSetVenueActive() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setVenueActive(id, isActive),
    onSuccess: (_venue, { isActive }) => toast.success(isActive ? 'Venue is visible again' : 'Venue hidden from customers'),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not change this venue.')),
    onSettled: refresh,
  });
}