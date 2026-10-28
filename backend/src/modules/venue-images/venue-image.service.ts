import { randomUUID } from 'node:crypto';
import { withTransaction } from '../../db/transaction.ts';
import { AppError } from '../../shared/errors/app-error.ts';
import { deleteFile, isStorageConfigured, uploadFile } from '../../shared/storage/storage.ts';
import type { AuthUser } from '../../shared/types/express.ts';
import * as venueRepo from '../venues/venue.repository.ts';
import { canManage } from '../venues/venue.service.ts';
import { processImage } from './process-image.ts';
import { MAX_IMAGES_PER_VENUE, type ReorderImagesInput } from './venue-image.schema.ts';
import * as repo from './venue-image.repository.ts';

// Loads the venue and checks that this user may change its photos
async function loadManageableVenue(venueId: number, user: AuthUser) {
  const venue = await venueRepo.findVenueById(venueId);
  if (!venue) throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
  if (!canManage(user, venue)) throw new AppError(403, 'NOT_VENUE_OWNER', 'You can only change photos of your own venues');
  return venue;
}

// Runs BEFORE the upload is read, so a stranger cannot make the server receive 40 MB of files
export async function assertCanUpload(venueId: number, user: AuthUser) {
  if (!isStorageConfigured()) {
    throw new AppError(503, 'STORAGE_NOT_CONFIGURED', 'Photo storage is not set up on this server');
  }
  await loadManageableVenue(venueId, user);
  if ((await repo.countImagesOfVenue(venueId)) >= MAX_IMAGES_PER_VENUE) {
    throw new AppError(409, 'IMAGE_LIMIT', `A venue can have at most ${MAX_IMAGES_PER_VENUE} photos`);
  }
}

export async function uploadImages(venueId: number, user: AuthUser, files: Express.Multer.File[]) {
  await loadManageableVenue(venueId, user);
  if (files.length === 0) {
    throw new AppError(400, 'NO_FILES', 'Choose at least one photo', [{ field: 'images', issue: 'No photo was sent' }]);
  }

  // 1. Check and shrink every photo first. One bad file rejects the whole upload, nothing is stored.
  const processed = await Promise.all(files.map(processImage));

  // 2. Put the files in the bucket
  const stored: { url: string; storageKey: string; thumbUrl: string; thumbKey: string }[] = [];
  try {
    for (const image of processed) {
      const name = randomUUID(); // random name, never the user's file name
      const storageKey = `venues/${venueId}/${name}.webp`;
      const thumbKey = `venues/${venueId}/${name}-thumb.webp`;
      const entry = { url: '', storageKey, thumbUrl: '', thumbKey };
      stored.push(entry); // listed BEFORE uploading, so a half-finished pair is cleaned up too
      entry.url = await uploadFile(storageKey, image.full, image.contentType);
      entry.thumbUrl = await uploadFile(thumbKey, image.thumb, image.contentType);
    }

    // 3. Save the addresses. The lock makes the "max 8" rule safe against two uploads at once.
    await withTransaction(async (client) => {
      await repo.lockVenue(venueId, client);
      if ((await repo.countImagesOfVenue(venueId, client)) + stored.length > MAX_IMAGES_PER_VENUE) {
        throw new AppError(409, 'IMAGE_LIMIT', `A venue can have at most ${MAX_IMAGES_PER_VENUE} photos`);
      }
      await repo.insertImages(venueId, stored, client);
    });
  } catch (error) {
    // Do not leave files in the bucket that no database row points to
    await Promise.allSettled(stored.flatMap((image) => [deleteFile(image.storageKey), deleteFile(image.thumbKey)]));
    throw error;
  }

  return repo.findImagesOfVenue(venueId);
}

export async function deleteImage(venueId: number, imageId: number, user: AuthUser) {
  await loadManageableVenue(venueId, user);
  const image = await repo.findImageRow(venueId, imageId);
  if (!image) throw new AppError(404, 'IMAGE_NOT_FOUND', 'Photo not found');

  // Database first: the photo disappears from the site at once. If removing the file then fails,
  // the worst case is one unused file in the bucket, never a broken picture on a page.
  await repo.deleteImageById(imageId);
  for (const key of [image.storage_key, image.thumb_key]) {
    try {
      await deleteFile(key);
    } catch (error) {
      console.error(`could not delete ${key} from the bucket`, error);
    }
  }

  return repo.findImagesOfVenue(venueId);
}

export async function reorderImages(venueId: number, user: AuthUser, input: ReorderImagesInput) {
  await loadManageableVenue(venueId, user);

  const current = await repo.findImagesOfVenue(venueId);
  const sameSet = current.length === input.imageIds.length && current.every((image) => input.imageIds.includes(image.id));
  if (!sameSet) {
    throw new AppError(400, 'INVALID_ORDER', 'Send every photo of this venue exactly once', [
      { field: 'imageIds', issue: 'The list must contain all photos of the venue, no more and no less' },
    ]);
  }

  await repo.setOrder(venueId, input.imageIds);
  return repo.findImagesOfVenue(venueId);
}