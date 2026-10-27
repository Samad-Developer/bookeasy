import { format, startOfDay } from 'date-fns';
import type { Slot } from '@/features/venues/types';

export type SlotDay = { key: string; date: Date; slots: Slot[] };

// Groups slots by the day they START, in the visitor's time zone.
// The API already sorts slots by start time, so the days come out in order.
export function groupSlotsByDay(slots: Slot[]): SlotDay[] {
  console.log('checking slots', slots);
  const days = new Map<string, SlotDay>();

  for (const slot of slots) {
    const start = new Date(slot.startsAt);
    const key = format(start, 'yyyy-MM-dd'); // "2026-11-01" is the same for every slot of that day
    const day = days.get(key) ?? { key, date: startOfDay(start), slots: [] };
    day.slots.push(slot);
    days.set(key, day);
  }

  return [...days.values()];
}