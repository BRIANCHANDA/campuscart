import { z } from "@hono/zod-openapi";
import { ApiErrorSchema } from "@campuscart/shared";

export const jsonContent = <T extends z.ZodTypeAny>(schema: T, description: string) => ({
  content: { "application/json": { schema } },
  description,
});

/** Standard error responses attached to authenticated routes. */
export const errorResponses = {
  400: jsonContent(ApiErrorSchema, "Bad request"),
  401: jsonContent(ApiErrorSchema, "Unauthorized"),
  403: jsonContent(ApiErrorSchema, "Forbidden"),
  404: jsonContent(ApiErrorSchema, "Not found"),
  409: jsonContent(ApiErrorSchema, "Conflict"),
} as const;

export const bearerSecurity = [{ Bearer: [] }];
