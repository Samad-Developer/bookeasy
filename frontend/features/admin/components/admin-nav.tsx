'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/venues', label: 'Venues' },
  { href: '/admin/bookings', label: 'Bookings' },
];

// The small menu at the top of every admin page
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="mb-8 flex flex-wrap gap-2 border-b pb-3">
      {LINKS.map((link) => {
        const active = pathname === link.href;
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