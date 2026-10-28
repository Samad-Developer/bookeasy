import sharp from 'sharp';
import { AppError } from '../../shared/errors/app-error.ts';
import type { ProcessedImage } from './venue-image.types.ts';

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);
const FULL_WIDTH = 1600; // the gallery on the venue page
const THUMB_WIDTH = 640; // venue cards: about 10x lighter than the full photo

// sharp reads the first bytes of the file to find out what it REALLY is, so a virus.exe renamed to photo.jpg is rejected.
// The result is always a fresh WebP file: smaller, the same format everywhere,
// and sharp drops EXIF data (phone photos contain the GPS location of where they were taken).
export async function processImage(file: Express.Multer.File): Promise<ProcessedImage> {
  const invalid = () =>
    new AppError(400, 'INVALID_IMAGE', `"${file.originalname}" is not a valid JPEG, PNG or WebP image`, [
      { field: 'images', issue: `${file.originalname}: use a JPEG, PNG or WebP photo` },
    ]);

  try {
    const image = sharp(file.buffer, { limitInputPixels: 50_000_000 }); // refuse "decompression bombs"
    const { format } = await image.metadata();
    if (!format || !ALLOWED_FORMATS.has(format)) throw invalid();

    // .rotate() turns the photo upright using its EXIF orientation; the orientation info is dropped afterwards.
    // The file is decoded once and written twice (clone), so making the small copy is cheap.
    const upright = image.rotate();
    const [full, thumb] = await Promise.all([
      upright.clone().resize({ width: FULL_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
      upright.clone().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
    ]);

    return { full, thumb, contentType: 'image/webp' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw invalid(); // sharp could not read the file at all
  }
}