import type { RequestHandler } from "express";
import { validationResult } from "express-validator";
export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false, message: "Validation failed",
      errors: errors.array().map((error) => ({ field: error.type === "field" ? error.path : "request", message: error.msg })),
    });
  }
  next();
};
