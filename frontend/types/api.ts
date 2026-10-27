// These types describe the JSON that my Express API sends back.
// They match src/shared/http/api-response.ts in the backend.

export type Role = 'customer' | 'owner' | 'admin';

export type PublicUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

// What /auth/login, /auth/signup and /auth/refresh return inside "data"
export type Session = {
  user: PublicUser;
  accessToken: string;
};

export type ErrorDetail = { field?: string; issue: string };

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Every successful response looks like this
export type ApiSuccess<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta: ResponseMeta;
};

// Every error response looks like this
export type ApiFailure = {
  success: false;
  statusCode: number;
  message: string;
  data: null;
  error: { code: string; details: ErrorDetail[] };
  meta: ResponseMeta;
};

export type ResponseMeta = {
  timestamp: string;
  traceId: string;
  pagination?: PaginationMeta; // list endpoints send this
  [key: string]: unknown; // endpoints can add more
};