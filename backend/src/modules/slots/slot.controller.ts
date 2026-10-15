import type { Request, Response } from 'express';
import { buildPagination, sendSuccess } from '../../shared/http/api-response.ts';
import type { CreateSlotInput, ListSlotsQuery, UpdateSlotInput } from './slot.schema.ts';
import * as service from './slot.service.ts';

// validate() already checked and converted req.params, so these are safe
const venueIdOf = (req: Request) => Number(req.params.venueId);
const slotIdOf = (req: Request) => Number(req.params.id);

export async function list(req: Request, res: Response) {
  const query = req.query as unknown as ListSlotsQuery;
  const { items, total } = await service.listSlots(venueIdOf(req), query, req.user);
  
  sendSuccess(req, res, {
    data: items,
    message: 'Slots fetched successfully.',
    meta: { pagination: buildPagination(query.page, query.limit, total) },
  });
}

export async function create(req: Request, res: Response) {
  const slot = await service.createSlot(venueIdOf(req), req.user!, req.body as CreateSlotInput);
  sendSuccess(req, res, { data: slot, message: 'Slot created successfully.', statusCode: 201 });
}

export async function update(req: Request, res: Response) {
  const slot = await service.updateSlot(slotIdOf(req), req.user!, req.body as UpdateSlotInput);
  sendSuccess(req, res, { data: slot, message: 'Slot updated successfully.' });
}

export async function remove(req: Request, res: Response) {
  await service.deleteSlot(slotIdOf(req), req.user!);
  sendSuccess(req, res, { data: null, message: 'Slot deleted successfully.' });
}
