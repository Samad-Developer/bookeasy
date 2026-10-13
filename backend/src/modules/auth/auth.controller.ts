import type { Request, Response } from "express";
import { env } from "../../config/env.ts";
import { sendSuccess } from "../../shared/http/api-response.ts";
import type { LoginInput, SignupInput } from "./auth.schema.ts";
import * as service from "./auth.service.ts";

const REFRESH_COOKIE = "refresh_token";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true, // JavaScript in the browser cannot read it
    secure: env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax",
    path: "/auth", // the browser sends it only to /auth/* routes
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function signup(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await service.signup(
    req.body as SignupInput,
  );
  setRefreshCookie(res, refreshToken);
  sendSuccess(req, res, {
    data: { user, accessToken },
    message: "Account created successfully.",
    statusCode: 201,
  });
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await service.login(
    req.body as LoginInput,
  );
  setRefreshCookie(res, refreshToken);
  sendSuccess(req, res, {
    data: { user, accessToken },
    message: "Logged in successfully.",
  });
}

export async function refresh(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await service.refresh(
    req.cookies[REFRESH_COOKIE],
  );
  setRefreshCookie(res, refreshToken);
  sendSuccess(req, res, {
    data: { user, accessToken },
    message: "Session refreshed successfully.",
  });
}

export async function logout(req: Request, res: Response) {
  await service.logout(req.cookies[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
  sendSuccess(req, res, { data: null, message: "Logged out successfully." });
}

export async function me(req: Request, res: Response) {
  const user = await service.getMe(req.user!.id);
  sendSuccess(req, res, {
    data: { user },
    message: "Profile fetched successfully.",
  });
}
