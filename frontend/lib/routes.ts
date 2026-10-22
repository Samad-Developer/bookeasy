import type { Role } from '@/types/api';

// Where each role lands after logging in, and which links its navbar shows.
// (In Step 3 the customer's home becomes the venue list.)
export const roleHome: Record<Role, string> = {
  customer: '/bookings',
  owner: '/owner',
  admin: '/admin',
};

export const roleNavLinks: Record<Role, { href: string; label: string }[]> = {
  customer: [{ href: '/bookings', label: 'My bookings' }],
  owner: [{ href: '/owner', label: 'Dashboard' }],
  admin: [{ href: '/admin', label: 'Admin' }],
};

// "?next=/bookings" tells the login page where to send the user afterwards.
// Anyone can type anything into a URL, so we only accept paths INSIDE our own site.
// Without this check, /login?next=https://evil.com would send users to a fake site after login.
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  if (next.startsWith('/login') || next.startsWith('/signup')) return null;
  return next;
}