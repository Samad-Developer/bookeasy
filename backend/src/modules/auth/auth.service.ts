import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { env } from "../../config/env.ts";
import { withTransaction } from "../../db/transaction.ts";
import { AppError } from "../../shared/errors/app-error.ts";
import * as repo from "./auth.repository.ts";
import type { LoginInput, SignupInput } from "./auth.schema.ts";
import type { PublicUser, Session, UserRow } from "./auth.types.ts";

const ACCESS_TTL = "15m";
const REFRESH_DAYS = 7;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const toPublicUser = (u: UserRow): PublicUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
});

function signAccessToken(user: UserRow) {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: String(user.id),
    expiresIn: ACCESS_TTL,
  });
}

async function startSession(user: UserRow, db?: PoolClient): Promise<Session> {
  const refreshToken = randomBytes(48).toString("hex");
  await repo.insertRefreshToken(
    { userId: user.id, tokenHash: sha256(refreshToken), days: REFRESH_DAYS },
    db,
  );

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

export async function signup(input: SignupInput): Promise<Session> {
  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    // Create the user and the first refresh token together: both happen or neither does
    return await withTransaction(async (client) => {
      const user = await repo.insertUser({ ...input, passwordHash }, client);
      return startSession(user, client);
    });
  } catch (err: any) {
    // 23505 = unique violation: the email already exists
    if (err.code === "23505")
      throw new AppError(
        409,
        "EMAIL_TAKEN",
        "This email is already registered",
      );
    throw err;
  }
}

export async function login(input: LoginInput): Promise<Session> {
  const user = await repo.findUserByEmail(input.email);
  // Same error for "no such email" and "wrong password" so attackers cannot probe which emails exist
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect",
    );
  }
  if (!user.is_active) throw new AppError(403, "ACCOUNT_DISABLED", "This account is disabled");
  return startSession(user);
}

// Rotation: the old refresh token is deleted and a new one is issued
export async function refresh(oldToken: string | undefined): Promise<Session> {
  if (!oldToken) throw new AppError(401, "NO_REFRESH_TOKEN", "Not logged in");

  const user = await repo.consumeRefreshToken(sha256(oldToken));
  if (!user || !user.is_active)
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Please log in again");

  return startSession(user);
}

export async function logout(token: string | undefined) {
  if (token) await repo.deleteRefreshToken(sha256(token));
}

export async function getMe(userId: number): Promise<PublicUser> {
  const user = await repo.findUserById(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  return toPublicUser(user);
}
