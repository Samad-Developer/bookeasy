'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageButtons } from '@/components/shared/page-buttons';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applyServerError } from '@/features/auth/form-errors';
import { useCreateSlot, useDeleteSlot, useManagedSlots, useUpdateSlotPrice } from '@/features/owner/hooks';
import { priceField, slotSchema, toSlotInput, type SlotFormValues } from '@/features/owner/schemas';
import { groupSlotsByDay } from '@/features/venues/slot-utils';
import type { Slot } from '@/features/venues/types';
import { ApiError, getErrorMessage } from '@/lib/api-client';
import { formatCount, formatDayHeading, formatPkr, formatTimeRange, relativeDayLabel } from '@/lib/format';

export function SlotManager({ venueId }: { venueId: number }) {
  return (
    <div className="space-y-10">
      <AddSlotForm venueId={venueId} />
      <SlotTable venueId={venueId} />
    </div>
  );
}

// ── add a slot ──────────────────────────────────────────────────────────────

function AddSlotForm({ venueId }: { venueId: number }) {
  const create = useCreateSlot(venueId);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors },
  } = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: { startsAt: '', endsAt: '', price: '' },
  });

  function onSubmit(values: SlotFormValues) {
    create.mutate(toSlotInput(values), {
      // empty the times but keep the price: owners usually add several slots with the same price
      onSuccess: () => reset({ startsAt: '', endsAt: '', price: getValues('price') }),
      onError: (error) => {
        // the API calls the field "pricePkr", our form calls it "price"
        if (error instanceof ApiError && error.fieldErrors.pricePkr) {
          setError('price', { message: error.fieldErrors.pricePkr });
          if (Object.keys(error.fieldErrors).length === 1) return;
        }
        applyServerError(error, setError, ['startsAt', 'endsAt']);
      },
    });
  }

  return (
    <section aria-labelledby="add-slot" className="space-y-4">
      <h2 id="add-slot" className="text-xl font-semibold tracking-tight">
        Add a slot
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Starts" htmlFor="startsAt" error={errors.startsAt?.message}>
            <Input
              id="startsAt"
              type="datetime-local"
              aria-invalid={!!errors.startsAt}
              aria-describedby={errors.startsAt ? 'startsAt-error' : undefined}
              {...register('startsAt')}
            />
          </FormField>

          <FormField label="Ends" htmlFor="endsAt" error={errors.endsAt?.message}>
            <Input
              id="endsAt"
              type="datetime-local"
              aria-invalid={!!errors.endsAt}
              aria-describedby={errors.endsAt ? 'endsAt-error' : undefined}
              {...register('endsAt')}
            />
          </FormField>

          <FormField label="Price (PKR)" htmlFor="price" error={errors.price?.message}>
            <Input
              id="price"
              inputMode="numeric"
              placeholder="90000"
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? 'price-error' : undefined}
              {...register('price')}
            />
          </FormField>
        </div>

        <p className="text-sm text-muted-foreground">Times are in your own time zone. A slot can be at most 24 hours long.</p>

        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Adding…' : 'Add slot'}
        </Button>
      </form>
    </section>
  );
}

// ── the upcoming slots ──────────────────────────────────────────────────────

function SlotTable({ venueId }: { venueId: number }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isFetching } = useManagedSlots(venueId, page);
  const days = useMemo(() => (data ? groupSlotsByDay(data.slots) : []), [data]);

  return (
    <section aria-labelledby="upcoming-slots" className="space-y-4">
      <h2 id="upcoming-slots" className="text-xl font-semibold tracking-tight">
        Upcoming slots
      </h2>

      {isPending && (
        <div role="status" aria-label="Loading slots" className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="text-destructive">{getErrorMessage(error, 'Could not load the slots.')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && data.slots.length === 0 && (
        <p className="text-muted-foreground">
          {page > 1 ? 'There is nothing on this page.' : 'No upcoming slots yet. Add your first slot above.'}
        </p>
      )}

      {data && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {formatCount(data.pagination.total)} upcoming {data.pagination.total === 1 ? 'slot' : 'slots'}
        </p>
      )}

      {days.length > 0 && (
        <div className={isFetching ? 'space-y-8 opacity-60 transition-opacity' : 'space-y-8 transition-opacity'}>
          {days.map((day) => {
            const relative = relativeDayLabel(day.date);
            return (
              <section key={day.key} aria-labelledby={`manage-day-${day.key}`}>
                <h3 id={`manage-day-${day.key}`} className="mb-2 font-medium">
                  {formatDayHeading(day.date)}
                  {relative && <span className="ml-2 text-sm font-normal text-muted-foreground">{relative}</span>}
                </h3>
                <ul className="divide-y border-y">
                  {day.slots.map((slot) => (
                    <SlotRow key={slot.id} slot={slot} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {data && <PageButtons page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </section>
  );
}

type RowMode = 'view' | 'edit-price' | 'confirm-delete';

function SlotRow({ slot }: { slot: Slot }) {
  const [mode, setMode] = useState<RowMode>('view');
  const [priceText, setPriceText] = useState(String(slot.pricePkr));
  const [priceError, setPriceError] = useState<string | null>(null);
  const updatePrice = useUpdateSlotPrice();
  const remove = useDeleteSlot();

  function savePrice() {
    const parsed = priceField.safeParse(priceText);
    if (!parsed.success) {
      setPriceError(parsed.error.issues[0].message);
      return;
    }
    setPriceError(null);
    updatePrice.mutate({ slotId: slot.id, pricePkr: Number(parsed.data) }, { onSuccess: () => setMode('view') });
  }

  function startEdit() {
    setPriceText(String(slot.pricePkr));
    setPriceError(null);
    setMode('edit-price');
  }

  return (
    <li className="space-y-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span>{formatTimeRange(slot.startsAt, slot.endsAt)}</span>

        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="tabular-nums">{formatPkr(slot.pricePkr)}</span>
          <span className={slot.isBooked ? 'w-16 text-sm font-medium' : 'w-16 text-sm text-muted-foreground'}>
            {slot.isBooked ? 'Booked' : 'Open'}
          </span>

          {mode === 'view' && (
            <span className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startEdit}>
                Edit price
              </Button>
              {/* a booked slot can never be deleted: cancel its booking first */}
              {!slot.isBooked && (
                <Button variant="outline" size="sm" onClick={() => setMode('confirm-delete')}>
                  Delete
                </Button>
              )}
            </span>
          )}
        </span>
      </div>

      {mode === 'edit-price' && (
        <div role="group" aria-label="Edit price" className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`price-${slot.id}`} className="text-sm">
              New price (PKR)
            </label>
            <Input
              id={`price-${slot.id}`}
              inputMode="numeric"
              className="w-40"
              value={priceText}
              aria-invalid={!!priceError}
              aria-describedby={priceError ? `price-${slot.id}-error` : undefined}
              onChange={(event) => setPriceText(event.target.value)}
            />
            <Button size="sm" disabled={updatePrice.isPending} onClick={savePrice}>
              {updatePrice.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" disabled={updatePrice.isPending} onClick={() => setMode('view')}>
              Cancel
            </Button>
          </div>
          {priceError && (
            <p id={`price-${slot.id}-error`} role="alert" className="text-sm text-destructive">
              {priceError}
            </p>
          )}
          {slot.isBooked && (
            <p className="text-sm text-muted-foreground">The customer who booked keeps the price they agreed to.</p>
          )}
        </div>
      )}

      {mode === 'confirm-delete' && (
        <div role="group" aria-label="Confirm delete" className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Delete this slot?</span>
          <Button
            variant="destructive"
            size="sm"
            disabled={remove.isPending}
            onClick={() => remove.mutate(slot.id, { onSettled: () => setMode('view') })}
          >
            {remove.isPending ? 'Deleting…' : 'Yes, delete it'}
          </Button>
          <Button variant="outline" size="sm" disabled={remove.isPending} onClick={() => setMode('view')}>
            Keep it
          </Button>
        </div>
      )}
    </li>
  );
}