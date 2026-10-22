import { api, applySession, clearSession, refreshSession } from '@/lib/api-client';
import type { PublicUser, Session } from '@/types/api';

// One function per backend auth endpoint. No React in this file.

export type LoginInput = { email: string; password: string };
export type SignupInput = { name: string; email: string; password: string; role: 'customer' | 'owner' };

export async function login(input: LoginInput) {
  const response = await api.post<Session>('/auth/login', input, { skipRefresh: true });
  applySession(response.data); // keeps the token in memory and tells the auth store
  return response.data.user;
}

export async function signup(input: SignupInput) {
  const response = await api.post<Session>('/auth/signup', input, { skipRefresh: true });
  applySession(response.data);
  return response.data.user;
}

export async function logout() {
  try {
    await api.post<null>('/auth/logout', undefined, { skipRefresh: true }); // the API deletes the refresh token and the cookie
  } finally {
    clearSession(); // even if the request failed, this browser is logged out
  }
}

// Runs once when the app opens: "I have no token in memory. Does the cookie still give me a session?"
export async function restoreSession() {
  const restored = await refreshSession();
  if (!restored) clearSession(); // not logged in (or API unreachable): continue as a guest
}

export async function fetchMe() {
  const response = await api.get<{ user: PublicUser }>('/auth/me');
  return response.data.user;
}