import type { Request, Response } from "express";
import { sendSuccess } from "../../shared/http/api-response.ts";
import type { StatsQuery } from "./stats.schema.ts";
import * as service from "./stats.service.ts";

export async function owner(req: Request, res: Response) {
  const stats = await service.getOwnerStats(
    req.user!.id,
    req.query as unknown as StatsQuery,
  );

  sendSuccess(req, res, {
    data: stats,
    message: "Statistics fetched successfully.",
  });
}

export async function platform(req: Request, res: Response) {
  const stats = await service.getPlatformStats(
    req.query as unknown as StatsQuery,
  );

  sendSuccess(req, res, {
    data: stats,
    message: "Platform statistics fetched successfully.",
  });
}
