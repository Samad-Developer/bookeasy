import type { Request, Response } from 'express';
import { buildPagination, sendSuccess } from '../../shared/http/api-response.ts';
import type { AdminBookingsQuery, AdminVenuesQuery, ListUsersQuery, UpdateUserInput } from './admin.schema.ts';
import * as service from './admin.service.ts';

export async function listUsers(req: Request, res: Response) {
  const query = req.query as unknown as ListUsersQuery;
  const { items, total } = await service.listUsers(query);
  sendSuccess(req, res, {
    data: items,
    message: 'Users fetched successfully.',
    meta: { pagination: buildPagination(query.page, query.limit, total) },
  });
}

export async function updateUser(req: Request, res: Response) {
  const user = await service.updateUser(req.user!.id, Number(req.params.id), req.body as UpdateUserInput);
  sendSuccess(req, res, { data: user, message: 'User updated successfully.' });
}

export async function listVenues(req: Request, res: Response) {
  const query = req.query as unknown as AdminVenuesQuery;
  const { items, total } = await service.listVenues(query);
  sendSuccess(req, res, {
    data: items,
    message: 'Venues fetched successfully.',
    meta: { pagination: buildPagination(query.page, query.limit, total) },
  });
}

export async function listBookings(req: Request, res: Response) {
  const query = req.query as unknown as AdminBookingsQuery;
  const { items, total } = await service.listBookings(query);
  sendSuccess(req, res, {
    data: items,
    message: 'Bookings fetched successfully.',
    meta: { pagination: buildPagination(query.page, query.limit, total) },
  });
}
