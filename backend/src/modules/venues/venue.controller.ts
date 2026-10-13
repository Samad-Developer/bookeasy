import type { Request, Response } from 'express';
import { buildPagination, sendSuccess } from '../../shared/http/api-response.ts';
import type { CreateVenueInput, ListVenuesQuery, PaginationQuery, UpdateVenueInput } from './venue.schema.ts';
import * as service from './venue.service.ts';

// validate() already checked and converted req.params / req.query, so these casts are safe
const idOf = (req: Request) => Number(req.params.id);

export async function create(req: Request, res: Response) {
  const venue = await service.createVenue(req.user!.id, req.body as CreateVenueInput);
  sendSuccess(req, res, { data: venue, message: 'Venue created successfully.', statusCode: 201 });
}

export async function list(req: Request, res: Response) {
  const query = req.query as unknown as ListVenuesQuery;
  const { items, total } = await service.listVenues(query);
  sendSuccess(req, res, {
    data: items,
    message: 'Venues fetched successfully.',
    meta: { pagination: buildPagination(query.page, query.limit, total) },
  });
}

export async function listMine(req: Request, res: Response) {
  const query = req.query as unknown as PaginationQuery;
  const { items, total } = await service.listMyVenues(req.user!.id, query);
  sendSuccess(req, res, {
    data: items,
    message: 'Your venues fetched successfully.',
    meta: { pagination: buildPagination(query.page, query.limit, total) },
  });
}

export async function getOne(req: Request, res: Response) {
  const venue = await service.getVenue(idOf(req), req.user);
  sendSuccess(req, res, { data: venue, message: 'Venue fetched successfully.' });
}

export async function update(req: Request, res: Response) {
  const venue = await service.updateVenue(idOf(req), req.user!, req.body as UpdateVenueInput);
  sendSuccess(req, res, { data: venue, message: 'Venue updated successfully.' });
}