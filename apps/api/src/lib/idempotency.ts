import { and, eq } from "drizzle-orm";
import type { Db } from "../db";
import { idempotencyKeys } from "../db/schema";
import { badRequest } from "./errors";

/**
 * Wraps a mutating handler with Idempotency-Key semantics:
 * same (key, user, endpoint) → replay the stored response instead of re-executing.
 * Used on checkout and payment endpoints.
 */
export async function withIdempotency<T>(
  db: Db,
  opts: { key: string | undefined; userId: string; endpoint: string },
  run: () => Promise<{ status: number; body: T }>,
): Promise<{ status: number; body: T; replayed: boolean }> {
  const { key, userId, endpoint } = opts;
  if (!key) throw badRequest("IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required");

  const existing = await db
    .select()
    .from(idempotencyKeys)
    .where(and(
      eq(idempotencyKeys.key, key),
      eq(idempotencyKeys.userId, userId),
      eq(idempotencyKeys.endpoint, endpoint),
    ))
    .limit(1);

  const hit = existing[0];
  if (hit) {
    return { status: hit.responseStatus, body: hit.responseBody as T, replayed: true };
  }

  const result = await run();
  await db
    .insert(idempotencyKeys)
    .values({
      key,
      userId,
      endpoint,
      responseStatus: result.status,
      responseBody: result.body as object,
    })
    .onConflictDoNothing(); // concurrent duplicate: first writer wins, both saw same logical op
  return { ...result, replayed: false };
}
