import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { login, logout, signup } from '@/features/auth/api';

// Hooks connect the plain functions in api.ts to React (loading state, success, errors).
// They do NOT navigate after login: <GuestOnly> redirects as soon as the user is logged in.

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => toast.success(`Welcome back, ${user.name}`),
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: signup,
    onSuccess: (user) => toast.success(`Account created. Welcome, ${user.name}`),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    // onSettled runs on success AND failure: logout() clears this browser's session either way
    onSettled: () => {
      queryClient.clear(); // forget cached data that belonged to the previous user
      router.replace('/');
      toast.success('Logged out');
    },
  });
}