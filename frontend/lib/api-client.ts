import { env } from '@/lib/env';
import type { ApiFailure, ApiSuccess, ErrorDetail, Session } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// The frontend's "central error handler + auth helper".
// Every call to the Express API goes through this file. It:
//   1. sends the refresh cookie            (credentials: 'include')
//   2. adds  Authorization: Bearer <token> (token lives in memory only)
//   3. on an expired token: refreshes ONCE, then retries the request
//   4. turns every failure into one ApiError the UI can understand
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. ApiError: one shape for every failure ────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number, // HTTP status. 0 means "could not reach the server at all"
    public code: string, // machine code from the API, e.g. SLOT_ALREADY_BOOKED
    message: string, // human message from the API
    public details: ErrorDetail[] = [],
    public traceId?: string, // quote this when debugging: it matches the backend log line
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // { email: 'Invalid email' } — easy to feed into React Hook Form's setError
  get fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const detail of this.details) {
      if (detail.field && !(detail.field in result)) result[detail.field] = detail.issue;
    }
    return result;
  }
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return error instanceof ApiError ? error.message : fallback;
}

// ── 2. The access token lives HERE, in a plain variable ─────────────────────
// Not in localStorage (any script on the page could steal it) and not in a cookie.
// Refreshing the page wipes it on purpose; the httpOnly refresh cookie brings it back.

let accessToken: string | null = null;

// Pages rendered on the server must never read or share this variable between visitors
const isBrowser = () => typeof window !== 'undefined';

export function getAccessToken() {
  return isBrowser() ? accessToken : null;
}

// The auth store (Zustand) registers itself here so the UI hears about login/logout/expiry
type SessionListener = (session: Session | null) => void;
let sessionListener: SessionListener | null = null;

export function onSessionChange(listener: SessionListener) {
  sessionListener = listener;
}

export function applySession(session: Session) {
  accessToken = session.accessToken;
  sessionListener?.(session);
}

export function clearSession() {
  accessToken = null;
  sessionListener?.(null);
}

// ── 3. Sending one request ──────────────────────────────────────────────────

export type RequestOptions = Omit<RequestInit, 'method' | 'body'> & {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  // true for login / signup / refresh / logout: a 401 there means "wrong credentials",
  // not "your access token expired", so refreshing would be pointless
  skipRefresh?: boolean;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(env.API_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function isSuccess<T>(payload: unknown): payload is ApiSuccess<T> {
  return typeof payload === 'object' && payload !== null && (payload as { success?: unknown }).success === true;
}

function isFailure(payload: unknown): payload is ApiFailure {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { success?: unknown }).success === false &&
    typeof (payload as { error?: unknown }).error === 'object'
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null; // not JSON (for example an HTML error page from a proxy)
  }
}

type FetchOptions = Omit<RequestOptions, 'skipRefresh'>;

async function execute<T>(method: string, path: string, options: FetchOptions): Promise<ApiSuccess<T>> {
  const { query, body, headers, ...init } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  // A FormData body (photo upload) is sent as it is: the browser writes the Content-Type itself,
  // including the "boundary" that separates the files. Everything else is JSON.
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) requestHeaders.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      credentials: 'include', // without this the browser would not send/receive the refresh cookie
    });
  } catch {
    // fetch only throws when the request never got an answer (server down, offline, CORS blocked)
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }

  const payload = await readJson(response);

  if (response.ok && isSuccess<T>(payload)) return payload;

  if (isFailure(payload)) {
    throw new ApiError(response.status, payload.error.code, payload.message, payload.error.details, payload.meta?.traceId);
  }

  throw new ApiError(
    response.status,
    'UNEXPECTED_RESPONSE',
    response.status >= 500 ? 'The server had a problem. Please try again.' : 'Unexpected response from the server.',
  );
}

// ── 4. Refreshing the session (the tricky part) ─────────────────────────────
// Refresh tokens are ROTATED: each one works exactly once. If two requests refresh at the
// same moment, the second one would carry an already-used token and fail, and the user
// would be logged out for no reason. So there is only ever ONE refresh in flight, and
// everybody who needs it waits for that same promise.

let refreshInFlight: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!isBrowser()) return Promise.resolve(false);
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  try {
    const response = await execute<Session>('POST', '/auth/refresh', {});
    applySession(response.data);
    return true;
  } catch (error) {
    // 401 = the server says this session is over. A network blip is NOT a reason to log out.
    if (error instanceof ApiError && error.status === 401) clearSession();
    return false;
  }
}

function tokenProbablyExpired(error: unknown, skipRefresh?: boolean) {
  return (
    isBrowser() &&
    !skipRefresh &&
    error instanceof ApiError &&
    error.status === 401 &&
    (error.code === 'INVALID_TOKEN' || error.code === 'UNAUTHENTICATED') // codes from requireAuth in the backend
  );
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  const { skipRefresh, ...fetchOptions } = options;
  const tokenWeSent = getAccessToken();

  try {
    return await execute<T>(method, path, fetchOptions);
  } catch (error) {
    if (!tokenProbablyExpired(error, skipRefresh)) throw error;

    // While our request was travelling, another request may already have refreshed the session.
    // Then the token in memory is newer than the one we sent, and we only need to retry.
    const someoneAlreadyRefreshed = getAccessToken() !== tokenWeSent;
    if (!someoneAlreadyRefreshed) {
      const refreshed = await refreshSession();
      if (!refreshed) throw error; // session is really over: the caller sees the original 401
    }

    return execute<T>(method, path, fetchOptions); // second and LAST attempt, so no infinite loop is possible
  }
}

// ── 5. What the rest of the app uses ────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};