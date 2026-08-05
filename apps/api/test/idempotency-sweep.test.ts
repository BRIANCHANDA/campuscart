/**
 * Idempotency retention: replay records must be swept once they age out, or
 * the table grows for the life of the deployment.
 *
 *   TEST_DATABASE_URL=postgres://campuscart:campuscart@localhost:5432/campuscart bun test
 */
import { describe, expect, test } from "bun:test";
import { ensureTestDb } from "./db-setup";

const DB_URL = process.env.TEST_DATABASE_URL;
const dbEnabled = Boolean(DB_URL);
if (!dbEnabled) console.warn("[idempotency] TEST_DATABASE_URL not set — skipping sweep tests");

describe.if(dbEnabled)("sweepIdempotencyKeys", () => {
  test("deletes only records older than the retention window", async () => {
    await ensureTestDb(DB_URL!);
    const { db } = await import("../src/db");
    const schema = await import("../src/db/schema");
    const { sweepIdempotencyKeys } = await import("../src/lib/idempotency");
    const { eq, and, inArray, sql } = await import("drizzle-orm");

    const run = Math.random().toString(36).slice(2, 8);
    const [user] = await db.insert(schema.users).values({
      email: `sweep+${run}@campuscart.test`,
      passwordHash: "x",
      fullName: "Sweep Tester",
      phone: `+26097${run.slice(0, 6).replace(/\D/g, "0").padEnd(6, "0")}`,
      role: "shopper",
    }).returning();

    const mk = async (key: string, ageHours: number) => {
      await db.insert(schema.idempotencyKeys).values({
        key, userId: user!.id, endpoint: "/checkout",
        responseStatus: 201, responseBody: { ok: true },
      });
      // Backdate rather than waiting.
      await db
        .update(schema.idempotencyKeys)
        .set({ createdAt: sql`now() - make_interval(hours => ${ageHours})` })
        .where(and(
          eq(schema.idempotencyKeys.key, key),
          eq(schema.idempotencyKeys.userId, user!.id),
        ));
    };

    const fresh = `fresh-${run}`;
    const stale = `stale-${run}`;
    const edge = `edge-${run}`;
    await mk(fresh, 1);    // well inside
    await mk(edge, 47);    // inside, just barely
    await mk(stale, 72);   // past it

    const deleted = await sweepIdempotencyKeys(db, 48);
    expect(deleted).toBeGreaterThanOrEqual(1);

    const left = await db
      .select({ key: schema.idempotencyKeys.key })
      .from(schema.idempotencyKeys)
      .where(and(
        eq(schema.idempotencyKeys.userId, user!.id),
        inArray(schema.idempotencyKeys.key, [fresh, edge, stale]),
      ));
    const keys = left.map((r) => r.key).sort();

    expect(keys).toEqual([edge, fresh].sort());
    expect(keys).not.toContain(stale);
  });

  test("is safe to run when there is nothing to sweep", async () => {
    await ensureTestDb(DB_URL!);
    const { db } = await import("../src/db");
    const { sweepIdempotencyKeys } = await import("../src/lib/idempotency");
    // A window nothing can fall outside of — must be a no-op, not an error.
    expect(await sweepIdempotencyKeys(db, 24 * 365 * 100)).toBe(0);
  });
});
