import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { buildHref } from '@/lib/urls';
import { cn } from '@/lib/utils';

// Previous / Next links. Each one is a normal link to ?page=N that keeps the other filters.
export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | undefined>; // the filters to keep, for example { q, city, category }
}) {
  if (totalPages <= 1) return null;

  const disabledClass = 'pointer-events-none opacity-50';

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={buildHref(basePath, params, page - 1)} className={buttonVariants({ variant: 'outline' })}>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(buttonVariants({ variant: 'outline' }), disabledClass)}>
          Previous
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={buildHref(basePath, params, page + 1)} className={buttonVariants({ variant: 'outline' })}>
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(buttonVariants({ variant: 'outline' }), disabledClass)}>
          Next
        </span>
      )}
    </nav>
  );
}