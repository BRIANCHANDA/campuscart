import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import { refreshTokens } from "../../db/schema";
import { unauthorized } from "../../lib/errors";
import { logger } from "../../lib/logger";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const hash = (token: string): string => createHash("sha256").update(token).digest("hex");

/** Mint an opaque refresh token; only its SHA-256 is stored. */
export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hash(raw),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return raw;
}

/**
 * Exchange a refresh token: validates, rotates (old one is single-use), and
 * returns the userId for the caller to mint a fresh access JWT.
 *
 * Reuse of an already-rotated token is the classic stolen-token signal —
 * we revoke every live token for that user and force a fresh login.
 */
export async function rotateRefreshToken(
  raw: string,
): Promise<{ userId: string; refreshToken: string }> {
  const tokenHash = hash(raw);
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) throw unauthorized("Invalid refresh token");

  if (row.revokedAt || row.replacedById) {
    // Token was already used or revoked → treat as theft, kill the family
    logger.warn("auth.refresh_token_reuse", { userId: row.userId });
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, row.userId), isNull(refreshTokens.revokedAt)));
    throw unauthorized("Refresh token reuse detected — please sign in again");
  }

  if (row.expiresAt.getTime() < Date.now()) throw unauthorized("Refresh token expired");

  const next = randomBytes(32).toString("base64url");
  const [replacement] = await db
    .insert(refreshTokens)
    .values({
      userId: row.userId,
      tokenHash: hash(next),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    })
    .returning();
  await db
    .update(refreshTokens)
    .set({ replacedById: replacement?.id, revokedAt: new Date() })
    .where(eq(refreshTokens.id, row.id));

  return { userId: row.userId, refreshToken: next };
}

/** Sign-out: revoke a specific token (no-op if unknown, by design). */
export async function revokeRefreshToken(raw: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hash(raw)));
}
