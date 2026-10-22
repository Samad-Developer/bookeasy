import { create } from 'zustand';
import type { PublicUser, Session } from '@/types/api';

// 'loading'       = we have not yet asked the API "is this browser still logged in?"
// 'authenticated' = yes, and `user` is filled in
// 'guest'         = no, show the public site
export type AuthStatus = 'loading' | 'authenticated' | 'guest';

type AuthState = {
  user: PublicUser | null;
  status: AuthStatus;
  setSession: (session: Session | null) => void;
};

// Only the USER is stored here. The access token stays in api-client.ts (a plain variable),
// so it never appears in React state, devtools or re-renders.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  setSession: (session) =>
    set(session ? { user: session.user, status: 'authenticated' } : { user: null, status: 'guest' }),
}));