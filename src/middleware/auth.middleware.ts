import type { RequestHandler } from "express";
import { ApiError } from "../utils/api-error";
import { verifyAccessToken } from "../utils/jwt";
export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new ApiError("Authentication is required.", 401));
  }
  try {
    req.user = verifyAccessToken(authorization.slice(7));
    next();
  } catch {
    next(new ApiError("Invalid or expired access token.", 401));
  }
};
