import type { RequestHandler } from "express";
import { ApiError } from "../utils/api-error";
import type { UserRole } from "../modules/auth/auth.types";
export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new ApiError("You do not have permission to perform this action.", 403));
    return next();
  };
}
