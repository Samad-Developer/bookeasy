import { useAuthStore } from '@/features/auth/auth-store';

// The hook every component uses to ask "who is logged in?"
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  return {
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}