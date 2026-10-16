import cookieParser from "cookie-parser";
import express from "express";
import { pool } from "./db/pool.ts";
import { errorHandler } from "./shared/errors/error-handler.ts";
import { sendSuccess } from "./shared/http/api-response.ts";
import { notFound } from "./shared/middleware/not-found.ts";
import { requestId } from "./shared/middleware/request-id.ts";
import { authRouter } from "./modules/auth/auth.routes.ts";
import { venueRouter } from './modules/venues/venue.routes.ts';
import { slotRouter } from "./modules/slots/slot.routes.ts";
import { statsRouter } from "./modules/stats/stats.routes.ts";
import { bookingRouter } from "./modules/bookings/booking.routes.ts";
import { adminRouter } from "./modules/admin/admin.routes.ts";

export const app = express();

app.use(requestId);
app.use(express.json());
app.use(cookieParser());

app.get("/health", async (req, res) => {
  await pool.query("SELECT 1");
  sendSuccess(req, res, { data: { db: "up" }, message: "Service is healthy." });
});

app.use("/auth", authRouter);
app.use("/venues", venueRouter);
app.use(slotRouter);
app.use(bookingRouter);
app.use('/stats', statsRouter); 
app.use('/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);