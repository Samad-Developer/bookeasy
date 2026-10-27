import type { ReactNode } from 'react';

// Pages everyone can open: the venue list and the venue details
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>;
}