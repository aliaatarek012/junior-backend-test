import { ApiError } from "./api-error";

export interface PageRequest { page?: unknown; limit?: unknown; }
export interface PageWindow { page: number; limit: number; offset: number; }

function toPositiveInteger(value: unknown, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < 1) throw new ApiError(`${name} must be a positive integer.`, 400);
  return parsed;
}

export function resolvePageWindow(request: PageRequest, defaultLimit: number, maxLimit = defaultLimit): PageWindow {
  const page = toPositiveInteger(request.page, 1, "Page");
  const limit = toPositiveInteger(request.limit, defaultLimit, "Limit");
  if (limit > maxLimit) throw new ApiError(`Limit must not exceed ${maxLimit}.`, 400);
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) throw new ApiError("Page is too large.", 400);
  return { page, limit, offset };
}
