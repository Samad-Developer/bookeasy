export type Role = 'customer' | 'owner' | 'admin';
export type AuthUser = { id: number; role: Role };

declare global {
  namespace Express {
    interface Request {
      traceId: string;
      user?: AuthUser;
    }
  }
}