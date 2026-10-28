import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../../config/env.ts';
import { AppError } from '../errors/app-error.ts';

// The ONLY file that talks to the photo bucket. Supabase Storage, Cloudflare R2 and AWS S3 all speak the S3 protocol,
// so the standard S3 client works for all of them; moving to another provider means changing the .env values (and, at most, this file).

const { STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_BUCKET, STORAGE_PUBLIC_URL, STORAGE_REGION } = env;

const configured = !!(STORAGE_ENDPOINT && STORAGE_ACCESS_KEY_ID && STORAGE_SECRET_ACCESS_KEY && STORAGE_BUCKET && STORAGE_PUBLIC_URL);

const client = configured
  ? new S3Client({
      region: STORAGE_REGION,
      endpoint: STORAGE_ENDPOINT,
      credentials: { accessKeyId: STORAGE_ACCESS_KEY_ID!, secretAccessKey: STORAGE_SECRET_ACCESS_KEY! },
      forcePathStyle: true, // bucket name goes in the path, which Supabase, R2 and local test servers all accept
      // Newer SDK versions add extra checksum headers that only AWS itself is guaranteed to understand.
      // Other S3-compatible services are safest without them.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
  : undefined;

function requireClient() {
  if (!client) {
    throw new AppError(503, 'STORAGE_NOT_CONFIGURED', 'Photo storage is not set up on this server');
  }
  return client;
}

// Where the browser can see a stored file
export const publicUrlFor = (key: string) => `${STORAGE_PUBLIC_URL!.replace(/\/+$/, '')}/${key}`;

export const isStorageConfigured = () => configured;

// Turns any failure of the storage service into one clear answer, so it is not mistaken for a database problem
async function callStorage<T>(action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    console.error('photo storage failed:', (error as Error).message);
    throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Photo storage is not reachable right now. Please try again.');
  }
}

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  const client = requireClient();
  await callStorage(() =>
    client.send(
      new PutObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        // The file name is random and never reused, so browsers may keep the photo for a year
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    ),
  );
  return publicUrlFor(key);
}

// Deleting a file that is already gone is not an error in S3, so this is safe to repeat
export async function deleteFile(key: string) {
  const client = requireClient();
  await callStorage(() => client.send(new DeleteObjectCommand({ Bucket: STORAGE_BUCKET, Key: key })));
}