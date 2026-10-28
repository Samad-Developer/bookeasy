'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { VenuePhoto } from '@/components/shared/venue-photo';
import { Button } from '@/components/ui/button';
import { ImagePicker } from '@/features/owner/components/image-picker';
import { MAX_IMAGES } from '@/features/owner/image-rules';
import { useDeleteImage, useReorderImages, useUploadImages } from '@/features/owner/hooks';
import type { VenueDetail } from '@/features/venues/types';
import { getErrorMessage } from '@/lib/api-client';

// The "Photos" part of the Details tab: see, add, delete, reorder and choose the cover.
// The first photo is the cover: the one customers see in lists.
export function VenuePhotos({ venue }: { venue: VenueDetail }) {
  const images = venue.images;
  const remaining = MAX_IMAGES - images.length;

  const [files, setFiles] = useState<File[]>([]);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const upload = useUploadImages();
  const remove = useDeleteImage();
  const reorder = useReorderImages();
  const busy = upload.isPending || remove.isPending || reorder.isPending;

  function uploadChosen() {
    upload.mutate(
      { venueId: venue.id, files },
      {
        onSuccess: () => {
          toast.success(files.length === 1 ? 'Photo added' : `${files.length} photos added`);
          setFiles([]);
        },
        // the chosen photos stay in the list, so the owner can try again
        onError: (error) => toast.error(getErrorMessage(error, 'Could not upload the photos.')),
      },
    );
  }

  function move(index: number, toIndex: number) {
    const ids = images.map((image) => image.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(toIndex, 0, moved);
    reorder.mutate({ venueId: venue.id, imageIds: ids });
  }

  return (
    <section aria-labelledby="photos-heading" className="max-w-2xl space-y-4">
      <div className="space-y-1">
        <h2 id="photos-heading" className="text-xl font-semibold tracking-tight">
          Photos
        </h2>
        <p className="text-sm text-muted-foreground">
          {images.length} of {MAX_IMAGES} photos. The first photo is the cover customers see in the venue list.
        </p>
      </div>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="space-y-2">
              <div className="relative">
                <VenuePhoto src={image.thumbUrl} alt={`${venue.name}, photo ${index + 1}`} className="aspect-[4/3] w-full" />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">Cover</span>
                )}
              </div>

              {confirmingId === image.id ? (
                <div role="group" aria-label="Confirm delete" className="space-y-1.5">
                  <p className="text-sm">Delete photo {index + 1}?</p>
                  <div className="flex gap-1.5">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => remove.mutate({ venueId: venue.id, imageId: image.id }, { onSettled: () => setConfirmingId(null) })}
                    >
                      {remove.isPending ? 'Deleting…' : 'Yes, delete'}
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmingId(null)}>
                      Keep
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {index > 0 && (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => move(index, 0)} aria-label={`Make photo ${index + 1} the cover`}>
                      Make cover
                    </Button>
                  )}
                  {index > 0 && (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => move(index, index - 1)} aria-label={`Move photo ${index + 1} earlier`}>
                      Earlier
                    </Button>
                  )}
                  {index < images.length - 1 && (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => move(index, index + 1)} aria-label={`Move photo ${index + 1} later`}>
                      Later
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmingId(image.id)} aria-label={`Delete photo ${index + 1}`}>
                    Delete
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 && <p className="text-sm text-muted-foreground">No photos yet. Venues with photos get far more attention.</p>}

      {remaining > 0 ? (
        <div className="space-y-3">
          <ImagePicker files={files} onChange={setFiles} max={remaining} disabled={upload.isPending} />
          {files.length > 0 && (
            <Button type="button" disabled={busy} onClick={uploadChosen}>
              {upload.isPending ? 'Uploading…' : files.length === 1 ? 'Upload 1 photo' : `Upload ${files.length} photos`}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">This venue has the maximum of {MAX_IMAGES} photos. Delete one to add another.</p>
      )}
    </section>
  );
}