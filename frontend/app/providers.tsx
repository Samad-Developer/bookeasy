'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { restoreSession } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/auth-store';
import { ApiError, onSessionChange } from '@/lib/api-client';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // data fetched in the last 30 s is "fresh": no refetch when you revisit a page
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // 400-499 means the request itself was wrong: asking again gives the same answer
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2; // network problems and 5xx may be temporary
        },
      },
    },
  });
}

// Runs once when the app opens in the browser
function AuthBootstrap() {
  useEffect(() => {
    // 1. whenever the session changes (login, logout, refresh, expiry), copy it into the auth store
    onSessionChange((session) => useAuthStore.getState().setSession(session));
    // 2. try to restore the session from the refresh cookie
    void restoreSession();
  }, []);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  // useState keeps ONE QueryClient for the whole life of the page
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}