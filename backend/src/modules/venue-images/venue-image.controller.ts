import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/http/api-response.ts';
import type { ReorderImagesInput } from './venue-image.schema.ts';
import * as service from './venue-image.service.ts';

const venueIdOf = (req: Request) => Number(req.params.id);

// Used as middleware in front of multer
export async function precheckUpload(req: Request, _res: Response, next: (error?: unknown) => void) {
  try {
    await service.assertCanUpload(venueIdOf(req), req.user!);
    next();
  } catch (error) {
    next(error);
  }
}

export async function upload(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const images = await service.uploadImages(venueIdOf(req), req.user!, files);
  sendSuccess(req, res, { data: images, message: 'Photos uploaded successfully.', statusCode: 201 });
}

export async function remove(req: Request, res: Response) {
  const images = await service.deleteImage(venueIdOf(req), Number(req.params.imageId), req.user!);
  sendSuccess(req, res, { data: images, message: 'Photo deleted successfully.' });
}

export async function reorder(req: Request, res: Response) {
  const images = await service.reorderImages(venueIdOf(req), req.user!, req.body as ReorderImagesInput);
  sendSuccess(req, res, { data: images, message: 'Photo order saved.' });
}