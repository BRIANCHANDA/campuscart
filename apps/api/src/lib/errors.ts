import type { Context } from "hono";
import { InvalidTransitionError, type ApiError } from "@campuscart/shared";

/** Thrown anywhere in a handler/service; the global error middleware maps it to the shared error shape. */
export class AppError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 502,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what: string) => new AppError(404, "NOT_FOUND", `${what} not found`);
export const forbidden = (msg = "You do not have access to this resource") =>
  new AppError(403, "FORBIDDEN", msg);
export const unauthorized = (msg = "Authentication required") =>
  new AppError(401, "UNAUTHORIZED", msg);
export const conflict = (code: string, msg: string) => new AppError(409, code, msg);
export const badRequest = (code: string, msg: string, details?: unknown) =>
  new AppError(400, code, msg, details);

export function toApiError(err: unknown): { status: number; body: ApiError } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.message, details: err.details } },
    };
  }
  // State-machine violations surface as conflicts, never 500s
  if (err instanceof InvalidTransitionError) {
    return {
      status: 409,
      body: { error: { code: "INVALID_TRANSITION", message: err.message } },
    };
  }
  console.error("[unhandled]", err);
  return {
    status: 500,
    body: { error: { code: "INTERNAL", message: "Internal server error" } },
  };
}

export function errorResponse(c: Context, err: unknown): Response {
  const { status, body } = toApiError(err);
  return c.json(body, status as 400);
}
