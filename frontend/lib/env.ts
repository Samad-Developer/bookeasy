// Reads environment variables in ONE place and fails early if one is missing.
// Next.js only exposes variables that start with NEXT_PUBLIC_ to the browser,
// and it only finds them when they are written exactly as process.env.NEXT_PUBLIC_NAME.

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is not set. Add it to frontend/.env.local and restart the dev server.');
}

export const env = {
  API_URL: apiUrl.replace(/\/$/, ''), // remove a trailing slash so we can write API_URL + '/auth/login'
};