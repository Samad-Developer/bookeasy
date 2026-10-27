'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/owner', label: 'Dashboard', match: (path: string) => path === '/owner' },
  { href: '/owner/venues', label: 'My venues', match: (path: string) => path.startsWith('/owner/venues') },
];

// The small menu at the top of every owner page
export function OwnerNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Owner" className="mb-8 flex gap-2 border-b pb-3">
      {LINKS.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(buttonVariants({ variant: active ? 'default' : 'ghost', size: 'sm' }))}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}