'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// One photo, or a grey box when there is no photo (or it fails to load).
// A plain <img> on purpose: the API already stores the photos resized (a small copy for lists and a large one for the gallery),
// so Next's image optimizer would only add a second resize and extra setup.
export function VenuePhoto({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div aria-hidden className={cn('flex items-center justify-center rounded-md bg-muted text-xs text-muted-foreground', className)}>
        No photo
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={cn('rounded-md bg-muted object-cover', className)}
    />
  );
}