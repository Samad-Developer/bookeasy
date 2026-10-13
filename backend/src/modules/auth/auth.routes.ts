import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.ts";
import { validate } from "../../shared/middleware/validate.ts";
import * as controller from "./auth.controller.ts";
import { loginSchema, signupSchema } from "./auth.schema.ts";

export const authRouter = Router();

authRouter.post("/signup", validate({ body: signupSchema }), controller.signup);
authRouter.post("/login", validate({ body: loginSchema }), controller.login);
authRouter.post("/refresh", controller.refresh);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", requireAuth, controller.me);
