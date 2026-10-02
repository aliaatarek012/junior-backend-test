import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as authService from "./auth.service";
export const login: RequestHandler = asyncHandler(async (request, response) => {
  const result = await authService.login({ email: request.body.email as string, password: request.body.password as string });
  response.status(200).json({ success: true, data: result });
});
