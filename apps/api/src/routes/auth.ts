import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import {
  AuthResponseSchema, ChangePasswordSchema, LoginRequestSchema, RefreshRequestSchema,
  RefreshResponseSchema, RegisterRequestSchema, UpdateProfileSchema, UserSchema,
} from "@campuscart/shared";
import { db } from "../db";
import { couriers, shopAdmins, users } from "../db/schema";
import { badRequest, conflict, unauthorized } from "../lib/errors";
import { issueToken, requireAuth } from "../middleware/auth";
import { rateLimit } from "../lib/rate-limit";
import {
  issueRefreshToken, revokeRefreshToken, rotateRefreshToken,
} from "../services/auth/refresh";
import { bearerSecurity, errorResponses, jsonContent } from "../lib/openapi";

export const authRoutes = new OpenAPIHono();

const emailKey = (body: unknown): string =>
  typeof body === "object" && body !== null && "email" in body
    ? String((body as { email: unknown }).email).toLowerCase()
    : "";
authRoutes.use("/register", rateLimit({ limit: 10, windowMs: 15 * 60_000, keyFrom: emailKey }));
authRoutes.use("/login", rateLimit({ limit: 10, windowMs: 15 * 60_000, keyFrom: emailKey }));
authRoutes.use("/refresh", rateLimit({ limit: 30, windowMs: 15 * 60_000 }));

const serializeUser = (u: typeof users.$inferSelect) => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  phone: u.phone,
  role: u.role,
  createdAt: u.createdAt.toISOString(),
});

async function shopIdsFor(userId: string): Promise<string[] | undefined> {
  const rows = await db.select().from(shopAdmins).where(eq(shopAdmins.userId, userId));
  return rows.length ? rows.map((r) => r.shopId) : undefined;
}

authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/register",
    tags: ["auth"],
    request: { body: jsonContent(RegisterRequestSchema, "New account") },
    responses: {
      201: jsonContent(AuthResponseSchema, "Account created"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length) throw conflict("EMAIL_TAKEN", "An account with this email already exists");

    const passwordHash = await Bun.password.hash(body.password);
    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        phone: body.phone,
        role: body.role,
      })
      .returning();
    if (!user) throw new Error("user insert failed");

    // Couriers get a profile row immediately; verification stays "pending"
    if (body.role === "courier") {
      await db.insert(couriers).values({ userId: user.id });
    }

    const token = await issueToken({ userId: user.id, role: user.role });
    const refreshToken = await issueRefreshToken(user.id);
    return c.json({ token, refreshToken, user: serializeUser(user) }, 201);
  },
);

authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/login",
    tags: ["auth"],
    request: { body: jsonContent(LoginRequestSchema, "Credentials") },
    responses: {
      200: jsonContent(AuthResponseSchema, "Authenticated"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user || !(await Bun.password.verify(body.password, user.passwordHash))) {
      throw unauthorized("Invalid email or password");
    }
    const token = await issueToken({
      userId: user.id,
      role: user.role,
      shopIds: user.role === "shop_admin" ? await shopIdsFor(user.id) : undefined,
    });
    const refreshToken = await issueRefreshToken(user.id);
    return c.json({ token, refreshToken, user: serializeUser(user) }, 200);
  },
);

/**
 * POST /auth/refresh — exchange a refresh token for a fresh access JWT.
 * The presented token is single-use: reuse revokes the whole family.
 */
authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/refresh",
    tags: ["auth"],
    request: { body: jsonContent(RefreshRequestSchema, "Refresh token") },
    responses: {
      200: jsonContent(RefreshResponseSchema, "Rotated credentials"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const { refreshToken } = c.req.valid("json");
    const rotated = await rotateRefreshToken(refreshToken);

    const [user] = await db.select().from(users).where(eq(users.id, rotated.userId)).limit(1);
    if (!user) throw unauthorized("Account no longer exists");

    const token = await issueToken({
      userId: user.id,
      role: user.role,
      shopIds: user.role === "shop_admin" ? await shopIdsFor(user.id) : undefined,
    });
    return c.json({ token, refreshToken: rotated.refreshToken }, 200);
  },
);

/** POST /auth/logout — revoke the presented refresh token. */
authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/logout",
    tags: ["auth"],
    request: { body: jsonContent(RefreshRequestSchema, "Refresh token to revoke") },
    responses: {
      200: jsonContent(z.object({ ok: z.boolean() }), "Signed out"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const { refreshToken } = c.req.valid("json");
    await revokeRefreshToken(refreshToken);
    return c.json({ ok: true }, 200);
  },
);

/** GET /auth/me — the authenticated user's own profile. */
authRoutes.openapi(
  createRoute({
    method: "get",
    path: "/me",
    tags: ["auth"],
    security: bearerSecurity,
    middleware: [requireAuth] as const,
    responses: { 200: jsonContent(UserSchema, "Current user"), ...errorResponses },
  }),
  async (c) => {
    const [user] = await db.select().from(users).where(eq(users.id, c.get("claims").sub)).limit(1);
    if (!user) throw unauthorized("Account no longer exists");
    return c.json(serializeUser(user), 200);
  },
);

/** PATCH /auth/me — update own name / phone. Email & role are immutable here. */
authRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/me",
    tags: ["auth"],
    security: bearerSecurity,
    middleware: [requireAuth] as const,
    request: { body: jsonContent(UpdateProfileSchema, "Profile fields to update") },
    responses: { 200: jsonContent(UserSchema, "Updated profile"), ...errorResponses },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const [user] = await db
      .update(users)
      .set({
        ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
      })
      .where(eq(users.id, c.get("claims").sub))
      .returning();
    if (!user) throw unauthorized("Account no longer exists");
    return c.json(serializeUser(user), 200);
  },
);

/** POST /auth/change-password — verify current, set new (all sessions keep working). */
authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/change-password",
    tags: ["auth"],
    security: bearerSecurity,
    middleware: [requireAuth] as const,
    request: { body: jsonContent(ChangePasswordSchema, "Current + new password") },
    responses: { 200: jsonContent(z.object({ ok: z.boolean() }), "Password changed"), ...errorResponses },
  }),
  async (c) => {
    const { currentPassword, newPassword } = c.req.valid("json");
    const [user] = await db.select().from(users).where(eq(users.id, c.get("claims").sub)).limit(1);
    if (!user) throw unauthorized("Account no longer exists");
    if (!(await Bun.password.verify(currentPassword, user.passwordHash))) {
      throw badRequest("WRONG_PASSWORD", "Your current password is incorrect");
    }
    await db.update(users).set({ passwordHash: await Bun.password.hash(newPassword) }).where(eq(users.id, user.id));
    return c.json({ ok: true }, 200);
  },
);
