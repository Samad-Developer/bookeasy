// The browser checks photos before uploading so the owner gets an instant, friendly message.
// The API checks everything again (it reads the real file content), because the browser can never be trusted.

export const MAX_IMAGES = 8; // per venue, same number as the backend
export const MAX_IMAGE_MB = 5;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

// Adds `incoming` to `current`, but only the files that pass. `problems` explains what was left out.
export function addFiles(current: File[], incoming: File[], limit: number) {
  const files = [...current];
  const problems: string[] = [];

  for (const file of incoming) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      problems.push(`"${file.name}" was not added: use a JPEG, PNG or WebP photo.`);
    } else if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      problems.push(`"${file.name}" was not added: it is bigger than ${MAX_IMAGE_MB} MB.`);
    } else if (files.some((existing) => sameFile(existing, file))) {
      // the same photo chosen twice: ignore silently
    } else if (files.length >= limit) {
      problems.push(`"${file.name}" was not added: you can add ${limit === 1 ? 'only 1 more photo' : `at most ${limit} photos`}.`);
    } else {
      files.push(file);
    }
  }

  return { files, problems };
}