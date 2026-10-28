import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../shared/middleware/auth.ts';
import { validate } from '../../shared/middleware/validate.ts';
import * as controller from './venue-image.controller.ts';
import {
  MAX_IMAGES_PER_VENUE,
  MAX_IMAGE_BYTES,
  reorderImagesSchema,
  venueImageItemParamsSchema,
  venueImageParamsSchema,
} from './venue-image.schema.ts';

export const venueImageRouter = Router();

// multer reads the uploaded files into memory (we shrink them before storing them anyway).
// The limits protect the server: too many or too big files are refused while they are still arriving.
const receivePhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES_PER_VENUE },
}).array('images', MAX_IMAGES_PER_VENUE);

const manage = [requireAuth, requireRole('owner', 'admin')];

// Mounted at /venues, so these are /venues/:id/images ...
venueImageRouter.post(
  '/:id/images',
  ...manage,
  validate({ params: venueImageParamsSchema }),
  controller.precheckUpload, // 1. may this person upload here? (before any file is read)
  receivePhotos, //              2. read the files
  controller.upload, //          3. check, shrink, store
);

// This MUST be declared before '/:id/images/:imageId', otherwise "order" would be read as an image id
venueImageRouter.patch(
  '/:id/images/order',
  ...manage,
  validate({ params: venueImageParamsSchema, body: reorderImagesSchema }),
  controller.reorder,
);

venueImageRouter.delete(
  '/:id/images/:imageId',
  ...manage,
  validate({ params: venueImageItemParamsSchema }),
  controller.remove,
);