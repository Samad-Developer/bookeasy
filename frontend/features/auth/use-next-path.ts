'use client';

import { useSearchParams } from 'next/navigation';
import { safeNextPath } from '@/lib/routes';

// Reads "?next=/some/page" from the URL, but only if it is a safe path inside our site
export function useNextPath() {
  const searchParams = useSearchParams();
  return safeNextPath(searchParams.get('next'));
}