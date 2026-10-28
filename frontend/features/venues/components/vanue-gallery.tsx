'use client';

import { useState } from 'react';
import { VenuePhoto } from '@/components/shared/venue-photo';
import type { VenueImage } from '@/features/venues/types';
import { cn } from '@/lib/utils';

// The big photo with a row of small ones under it. Clicking a small one shows it big.
// A Client Component only because it remembers which photo is selected.
export function VenueGallery({ images, name }: { images: VenueImage[]; name: string }) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) return null;

  const current = images[Math.min(selected, images.length - 1)];

  return (
    <section aria-label={`Photos of ${name}`} className="max-w-3xl space-y-3">
      <VenuePhoto src={current.url} alt={`${name}, photo ${images.indexOf(current) + 1} of ${images.length}`} className="aspect-[16/10] w-full" />

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={image.id === current.id ? 'true' : undefined}
                className={cn(
                  'block w-full overflow-hidden rounded-md outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring',
                  image.id === current.id ? 'ring-2 ring-foreground' : 'opacity-70 hover:opacity-100',
                )}
              >
                <VenuePhoto src={image.thumbUrl} alt="" className="aspect-[4/3] w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}