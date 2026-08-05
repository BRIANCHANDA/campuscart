import type { MiddlewareHandler } from "hono";
import { sign, verify } from "hono/jwt";
import { JwtClaimsSchema, type JwtClaims, type Role } from "@campuscart/shared";
import { env } from "../env";
import { forbidden, unauthorized } from "../lib/errors";

declare module "hono" {
  interface ContextVariableMap {
    claims: JwtClaims;
  }
}

export async function issueToken(input: {
  userId: string;
  role: Role;
  shopIds?: string[];
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = {
    sub: input.userId,
    role: input.role,
    shopIds: input.shopIds,
    iat: now,
    exp: now + env.JWT_EXPIRES_IN_SECONDS,
  };
  return sign(claims, env.JWT_SECRET, "HS256");
}

/** Requires a valid Bearer token; parses and validates the claims payload. */
export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) throw unauthorized();
  try {
    const payload = await verify(header.slice(7), env.JWT_SECRET, "HS256");
    c.set("claims", JwtClaimsSchema.parse(payload));
  } catch {
    throw unauthorized("Invalid or expired token");
  }
  await next();
};

/** Role gate. platform_admin passes every gate. */
export function requireRole(...roles: Role[]): MiddlewareHandler {
  return async (c, next) => {
    const claims = c.get("claims");
    if (!claims) throw unauthorized();
    if (claims.role !== "platform_admin" && !roles.includes(claims.role)) {
      throw forbidden();
    }
    await next();
  };
}

/**
 * Tenant isolation gate: the :shopId in the path must be a shop this user administers.
 * Never trust a client-supplied shop ID without this ownership check.
 */
export const requireShopOwnership: MiddlewareHandler = async (c, next) => {
  const claims = c.get("claims");
  const shopId = c.req.param("shopId");
  if (!claims) throw unauthorized();
  if (claims.role !== "platform_admin") {
    if (!shopId || !claims.shopIds?.includes(shopId)) {
      throw forbidden("You do not administer this shop");
    }
  }
  await next();
};
