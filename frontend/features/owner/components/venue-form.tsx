'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applyServerError } from '@/features/auth/form-errors';
import { ImagePicker } from '@/features/owner/components/image-picker';
import { useCreateVenue, useUpdateVenue, useUploadImages } from '@/features/owner/hooks';
import { MAX_IMAGES } from '@/features/owner/image-rules';
import { toVenueInput, venueSchema, type VenueFormValues } from '@/features/owner/schemas';
import { categoryLabel, VENUE_CATEGORIES, type Venue } from '@/features/venues/types';
import { getErrorMessage } from '@/lib/api-client';

const FIELDS = ['name', 'category', 'city', 'address', 'capacity', 'description'] as const;

const selectClass =
  'h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive';

// One form for BOTH "add a venue" (no `venue` prop) and "edit a venue" (with `venue`)
export function VenueForm({ venue }: { venue?: Venue }) {
  const router = useRouter();
  const create = useCreateVenue();
  const update = useUpdateVenue(venue?.id ?? 0);
  const upload = useUploadImages();
  const [photos, setPhotos] = useState<File[]>([]); // only used when adding a new venue
  const saving = create.isPending || update.isPending || upload.isPending;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: venue?.name ?? '',
      category: (venue?.category as VenueFormValues['category'] | undefined) ?? 'wedding_hall',
      city: venue?.city ?? '',
      address: venue?.address ?? '',
      capacity: venue ? String(venue.capacity) : '',
      description: venue?.description ?? '',
    },
  });

  // Adding a venue with photos takes two requests: the venue must exist before photos can be attached to it.
  // If the second one fails the venue is already saved, so we do not start over: we send the owner to the
  // Details tab, where the same photos can be added again.
  async function createWithPhotos(values: VenueFormValues) {
    let created: Venue;
    try {
      created = await create.mutateAsync(toVenueInput(values));
    } catch (error) {
      applyServerError(error, setError, [...FIELDS]);
      return;
    }

    if (photos.length === 0) {
      router.push(`/owner/venues/${created.id}/slots`); // the next thing an owner needs is slots
      return;
    }

    try {
      await upload.mutateAsync({ venueId: created.id, files: photos });
      router.push(`/owner/venues/${created.id}/slots`);
    } catch (error) {
      toast.error('Venue created, but the photos were not uploaded. Add them on this page.', {
        description: getErrorMessage(error, 'Please try again.'),
      });
      router.push(`/owner/venues/${created.id}`);
    }
  }

  function onSubmit(values: VenueFormValues) {
    if (venue) {
      const onError = (error: unknown) => applyServerError(error, setError, [...FIELDS]);
      update.mutate(toVenueInput(values), {
        onSuccess: (saved) => {
          toast.success('Venue saved');
          // the API cleans the city ("lAHore" -> "Lahore"): show what was really saved
          reset({ ...values, city: saved.city });
        },
        onError,
      });
    } else {
      void createWithPhotos(values);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-4">
      {errors.root && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <FormField label="Name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} {...register('name')} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Type" htmlFor="category" error={errors.category?.message}>
          <select
            id="category"
            className={selectClass}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
            {...register('category')}
          >
            {VENUE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Capacity (guests)" htmlFor="capacity" error={errors.capacity?.message}>
          <Input
            id="capacity"
            inputMode="numeric"
            aria-invalid={!!errors.capacity}
            aria-describedby={errors.capacity ? 'capacity-error' : undefined}
            {...register('capacity')}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'city-error' : undefined} {...register('city')} />
        </FormField>

        <FormField label="Address" htmlFor="address" error={errors.address?.message}>
          <Input
            id="address"
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? 'address-error' : undefined}
            {...register('address')}
          />
        </FormField>
      </div>

      <FormField label="Description" htmlFor="description" error={errors.description?.message} hint="Optional. What makes this venue a good choice?">
        <textarea
          id="description"
          rows={5}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          {...register('description')}
        />
      </FormField>

      {!venue && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Photos (optional)</p>
          <ImagePicker files={photos} onChange={setPhotos} max={MAX_IMAGES} disabled={saving} firstIsCover />
        </div>
      )}

      <Button type="submit" disabled={saving || (!!venue && !isDirty)}>
        {upload.isPending ? 'Uploading photos…' : saving ? 'Saving…' : venue ? 'Save changes' : 'Create venue'}
      </Button>
    </form>
  );
}