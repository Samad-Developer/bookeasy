import type { Request, Response } from 'express';
import { buildPagination, sendSuccess } from '../../shared/http/api-response.ts';
import type { CreateBookingInput, ListBookingsQuery } from './booking.schema.ts';
import * as service from './booking.service.ts';

// validate() already checked and converted req.params / req.query
const idOf = (req: Request) => Number(req.params.id);

export async function create(req: Request, res: Response) {
  const { slotId } = req.body as CreateBookingInput;
  const booking = await service.createBooking(req.user!.id, slotId);
  sendSuccess(req, res, { data: booking, message: 'Booking confirmed.', statusCode: 201 });
}

export async function listMine(req: Request, res: Response) {
  const query = req.query as unknown as ListBookingsQuery;
  const { items, total } = await service.listMyBookings(req.user!.id, query);
  sendSuccess(req, res, {
    data: items,
    message: 'Your bookings fetched successfully.',
    meta: { pagination: buildPagination(query.page, query.limit, total) },
  });
}

export async function listForVenue(req: Request, res: Response) {
  const query = req.query as unknown as ListBookingsQuery;
  const { items, total } = await service.listVenueBookings(Number(req.params.venueId), req.user!, query);
  sendSuccess(req, res, {
    data: items,
    message: 'Venue bookings fetched successfully.',
    meta: { pagination: buildPagination(query.page, query.limit, total) },
  });
}

export async function getOne(req: Request, res: Response) {
  const booking = await service.getBooking(idOf(req), req.user!);
  sendSuccess(req, res, { data: booking, message: 'Booking fetched successfully.' });
}

export async function cancel(req: Request, res: Response) {
  const booking = await service.cancelBooking(idOf(req), req.user!);
  sendSuccess(req, res, { data: booking, message: 'Booking cancelled.' });
}
