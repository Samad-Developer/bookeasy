import type { Role } from '../../shared/types/express.d.ts';

export type UserRow = {
  id: number;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  is_active: boolean;
};

export type PublicUser = Pick<UserRow, 'id' | 'email' | 'name' | 'role'>;

export type Session = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};