import { and, eq, lt, sql } from "drizzle-orm";
import type { Db } from "../db";
import { idempotencyKeys } from "../db/schema";
import { badRequest } from "./errors";
import { logger } from "./logger";

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

/**
 * Drop replay records past their retention window. Without this the table
 * grows without bound — every checkout writes one row forever.
 *
 * The window only needs to outlive a client's retry horizon; beyond that a
 * repeated key is a new logical operation, not a replay. Safe to run from
 * every replica concurrently: the DELETE is idempotent.
 */
export async function sweepIdempotencyKeys(db: Db, retentionHours: number): Promise<number> {
  const deleted = await db
    .delete(idempotencyKeys)
    .where(lt(idempotencyKeys.createdAt, sql`now() - make_interval(hours => ${retentionHours})`))
    .returning({ key: idempotencyKeys.key });
  return deleted.length;
}

/**
 * Runs {@link sweepIdempotencyKeys} on an interval. Returns a stop function.
 * `unref` keeps the timer from holding the process open on shutdown.
 */
export function startIdempotencySweeper(
  db: Db,
  opts: { retentionHours: number; intervalMs: number },
): () => void {
  const tick = (): void => {
    void sweepIdempotencyKeys(db, opts.retentionHours)
      .then((n) => { if (n > 0) logger.info("idempotency.swept", { deleted: n }); })
      .catch((err: unknown) => logger.warn("idempotency.sweep_failed", { err: String(err) }));
  };
  const timer = setInterval(tick, opts.intervalMs);
  timer.unref?.();
  tick(); // clear anything left by a previous run's downtime
  return () => clearInterval(timer);
}
