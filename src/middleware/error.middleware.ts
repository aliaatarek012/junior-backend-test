import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../utils/api-error";
export const notFoundHandler: RequestHandler = (_req, res) => { res.status(404).json({ success: false, message: "Route not found." }); };
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Request body must contain valid JSON." });
  }
  if (error instanceof Error && error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid resource identifier." });
  if (error instanceof Error && error.name === "ValidationError") return res.status(400).json({ success: false, message: "Database validation failed." });
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ success: false, message: error instanceof ApiError ? error.message : "An unexpected error occurred." });
};
