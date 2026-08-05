import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, desc, eq, sum } from "drizzle-orm";
import {
  CourierSchema, CreateShopSchema, IdSchema, PlacedCoordinatesSchema, ShopSchema, UpdateShopSchema,
} from "@campuscart/shared";
import { db } from "../db";
import { couriers, payoutLedger, products, shopAdmins, shops, users } from "../db/schema";
import { badRequest, notFound } from "../lib/errors";
import { logger } from "../lib/logger";
import { requireAuth, requireRole } from "../middleware/auth";
import { bearerSecurity, errorResponses, jsonContent } from "../lib/openapi";
import { serializeShop } from "./shops";

/** Platform admin: onboard shops, promote shop admins, verify couriers. */
export const platformAdminRoutes = new OpenAPIHono();
platformAdminRoutes.use("*", requireAuth, requireRole("platform_admin"));

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

platformAdminRoutes.openapi(
  createRoute({
    method: "post",
    path: "/shops",
    tags: ["platform-admin"],
    security: bearerSecurity,
    request: {
      body: jsonContent(
        CreateShopSchema.extend({
          adminUserId: IdSchema.optional(),
          /** Existing user to promote to shop_admin and attach — by email. */
          adminEmail: z.string().email().optional(),
          /**
           * Required, and never (0,0): the pickup point feeds delivery-fee
           * quotes and proximity-based courier assignment, so a shop without
           * one is quietly broken for every delivery it takes.
           */
          location: PlacedCoordinatesSchema,
        }),
        "New shop (optionally with its first admin, by id or email)",
      ),
    },
    responses: { 201: jsonContent(ShopSchema, "Created"), ...errorResponses },
  }),
  async (c) => {
    const body = c.req.valid("json");

    // Resolve the admin BEFORE creating the shop so a typo'd email fails whole.
    let adminUserId = body.adminUserId ?? null;
    if (!adminUserId && body.adminEmail) {
      const [user] = await db.select().from(users).where(eq(users.email, body.adminEmail)).limit(1);
      if (!user) {
        throw badRequest("ADMIN_NOT_FOUND", `No account with email ${body.adminEmail} — ask them to register first`);
      }
      if (user.role === "platform_admin") {
        throw badRequest("ADMIN_INVALID", "Platform admins already manage every shop");
      }
      adminUserId = user.id;
    }

    const [shop] = await db
      .insert(shops)
      .values({
        name: body.name,
        slug: `${slugify(body.name)}-${crypto.randomUUID().slice(0, 6)}`,
        description: body.description ?? null,
        address: body.address ?? null,
        imageUrl: body.imageUrl ?? null,
        pickupLat: body.location.lat,
        pickupLng: body.location.lng,
      })
      .returning();
    if (!shop) throw new Error("shop insert failed");

    if (adminUserId) {
      await db.update(users).set({ role: "shop_admin" }).where(eq(users.id, adminUserId));
      await db.insert(shopAdmins).values({ shopId: shop.id, userId: adminUserId });
      logger.info("shop.admin_attached", { shopId: shop.id, adminUserId });
    }
    return c.json(serializeShop(shop), 201);
  },
);

/** GET /platform/shops — every shop (incl. blocked), with admins + product count. */
platformAdminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/shops",
    tags: ["platform-admin"],
    security: bearerSecurity,
    responses: {
      200: jsonContent(
        z.array(ShopSchema.extend({
          admins: z.array(z.object({ userId: IdSchema, fullName: z.string(), email: z.string() })),
          productCount: z.number().int(),
        })),
        "All shops with their admins",
      ),
      ...errorResponses,
    },
  }),
  async (c) => {
    const [shopRows, adminRows, productRows] = await Promise.all([
      db.select().from(shops).orderBy(desc(shops.createdAt)),
      db
        .select({ shopId: shopAdmins.shopId, userId: users.id, fullName: users.fullName, email: users.email })
        .from(shopAdmins)
        .innerJoin(users, eq(shopAdmins.userId, users.id)),
      db.select({ shopId: products.shopId, n: count() }).from(products).groupBy(products.shopId),
    ]);
    const adminsByShop = new Map<string, { userId: string; fullName: string; email: string }[]>();
    for (const a of adminRows) {
      const list = adminsByShop.get(a.shopId) ?? [];
      list.push({ userId: a.userId, fullName: a.fullName, email: a.email });
      adminsByShop.set(a.shopId, list);
    }
    const countByShop = new Map(productRows.map((r) => [r.shopId, r.n]));
    return c.json(
      shopRows.map((s) => ({
        ...serializeShop(s),
        admins: adminsByShop.get(s.id) ?? [],
        productCount: countByShop.get(s.id) ?? 0,
      })),
      200,
    );
  },
);

/** PATCH /platform/shops/{shopId} — edit details or block/unblock (isActive). */
platformAdminRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/shops/{shopId}",
    tags: ["platform-admin"],
    security: bearerSecurity,
    request: {
      params: z.object({ shopId: IdSchema }),
      body: jsonContent(UpdateShopSchema.extend({ adminEmail: z.string().email().optional() }), "Fields to update"),
    },
    responses: { 200: jsonContent(ShopSchema, "Updated"), ...errorResponses },
  }),
  async (c) => {
    const { shopId } = c.req.valid("param");
    const body = c.req.valid("json");
    const [shop] = await db
      .update(shops)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.location !== undefined
          ? { pickupLat: body.location.lat, pickupLng: body.location.lng }
          : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      })
      .where(eq(shops.id, shopId))
      .returning();
    if (!shop) throw notFound("Shop");

    // Attach another admin by email, same rules as creation.
    if (body.adminEmail) {
      const [user] = await db.select().from(users).where(eq(users.email, body.adminEmail)).limit(1);
      if (!user) throw badRequest("ADMIN_NOT_FOUND", `No account with email ${body.adminEmail}`);
      if (user.role !== "platform_admin") {
        await db.update(users).set({ role: "shop_admin" }).where(eq(users.id, user.id));
        await db
          .insert(shopAdmins)
          .values({ shopId: shop.id, userId: user.id })
          .onConflictDoNothing();
      }
    }
    logger.info("shop.updated", { shopId, isActive: shop.isActive });
    return c.json(serializeShop(shop), 200);
  },
);

/**
 * POST /platform/shop-admins — the admin provisions a shop-owner account.
 * Owners never self-register: the admin creates their login here (optionally
 * attaching them to a shop in one step) and hands over the credentials. The
 * owner then signs in on their own like any other user.
 */
platformAdminRoutes.openapi(
  createRoute({
    method: "post",
    path: "/shop-admins",
    tags: ["platform-admin"],
    security: bearerSecurity,
    request: {
      body: jsonContent(
        z.object({
          email: z.string().email(),
          password: z.string().min(8),
          fullName: z.string().min(1),
          phone: z.string().min(6),
          shopId: IdSchema.optional(),
        }),
        "New shop-owner account (optionally attached to a shop)",
      ),
    },
    responses: {
      201: jsonContent(
        z.object({
          id: IdSchema, email: z.string(), fullName: z.string(), phone: z.string(), role: z.string(),
        }),
        "Created owner",
      ),
      ...errorResponses,
    },
  }),
  async (c) => {
    const body = c.req.valid("json");

    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      throw badRequest("EMAIL_TAKEN", `An account with ${body.email} already exists — attach it by email instead`);
    }
    if (body.shopId) {
      const [shop] = await db.select().from(shops).where(eq(shops.id, body.shopId)).limit(1);
      if (!shop) throw notFound("Shop");
    }

    const passwordHash = await Bun.password.hash(body.password);
    const [user] = await db
      .insert(users)
      .values({
        email: body.email, passwordHash, fullName: body.fullName, phone: body.phone, role: "shop_admin",
      })
      .returning();
    if (!user) throw new Error("owner insert failed");

    if (body.shopId) {
      await db.insert(shopAdmins).values({ shopId: body.shopId, userId: user.id }).onConflictDoNothing();
    }
    logger.info("shop_admin.created", { userId: user.id, shopId: body.shopId ?? null });
    return c.json(
      { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role },
      201,
    );
  },
);

platformAdminRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/couriers/{courierId}/verification",
    tags: ["platform-admin"],
    security: bearerSecurity,
    request: {
      params: z.object({ courierId: IdSchema }),
      body: jsonContent(
        z.object({ status: z.enum(["verified", "rejected", "suspended"]) }),
        "Verification decision",
      ),
    },
    responses: { 200: jsonContent(CourierSchema, "Updated"), ...errorResponses },
  }),
  async (c) => {
    const { courierId } = c.req.valid("param");
    const { status } = c.req.valid("json");
    const [courier] = await db
      .update(couriers)
      .set({ verificationStatus: status, ...(status !== "verified" ? { isAvailable: false } : {}) })
      .where(eq(couriers.id, courierId))
      .returning();
    if (!courier) throw notFound("Courier");
    return c.json({
      id: courier.id, userId: courier.userId, verificationStatus: courier.verificationStatus,
      isAvailable: courier.isAvailable, vehicleType: courier.vehicleType, nrcNumber: courier.nrcNumber,
    }, 200);
  },
);

/** GET /platform/couriers — verification queue / directory (filter by status). */
platformAdminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/couriers",
    tags: ["platform-admin"],
    security: bearerSecurity,
    request: {
      query: z.object({
        status: z.enum(["pending", "verified", "rejected", "suspended"]).optional(),
      }),
    },
    responses: {
      200: jsonContent(
        z.array(CourierSchema.extend({ fullName: z.string(), phone: z.string() })),
        "Couriers with their user identity",
      ),
      ...errorResponses,
    },
  }),
  async (c) => {
    const { status } = c.req.valid("query");
    const rows = await db
      .select({ courier: couriers, fullName: users.fullName, phone: users.phone })
      .from(couriers)
      .innerJoin(users, eq(couriers.userId, users.id))
      .where(status ? eq(couriers.verificationStatus, status) : undefined)
      .orderBy(couriers.createdAt);
    return c.json(
      rows.map(({ courier, fullName, phone }) => ({
        id: courier.id, userId: courier.userId, verificationStatus: courier.verificationStatus,
        isAvailable: courier.isAvailable, vehicleType: courier.vehicleType,
        nrcNumber: courier.nrcNumber, fullName, phone,
      })),
      200,
    );
  },
);

/**
 * GET /platform/payouts/pending — pending courier earnings grouped by courier.
 * POST /platform/payouts/settle — settle one courier's pending entries.
 *
 * Settlement marks the ledger rows settled in a transaction. When MoMo
 * Disbursements is configured, the kwacha is actually pushed to the courier's
 * MSISDN first and the transfer reference lands on every settled row; without
 * it, settlement records a manual payout (ref "manual").
 */
platformAdminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/payouts/pending",
    tags: ["platform-admin"],
    security: bearerSecurity,
    responses: {
      200: jsonContent(
        z.array(z.object({
          courierId: IdSchema,
          fullName: z.string(),
          phone: z.string(),
          pendingMinor: z.number().int(),
          entries: z.number().int(),
        })),
        "Pending payouts grouped by courier",
      ),
      ...errorResponses,
    },
  }),
  async (c) => {
    const rows = await db
      .select({
        courierId: payoutLedger.courierId,
        pendingMinor: sum(payoutLedger.amountMinor).mapWith(Number),
        entries: count(),
        fullName: users.fullName,
        phone: users.phone,
      })
      .from(payoutLedger)
      .innerJoin(couriers, eq(payoutLedger.courierId, couriers.id))
      .innerJoin(users, eq(couriers.userId, users.id))
      .where(and(eq(payoutLedger.entryType, "courier_payout"), eq(payoutLedger.status, "pending")))
      .groupBy(payoutLedger.courierId, users.fullName, users.phone);
    return c.json(
      rows.flatMap((r) => (r.courierId ? [{
        courierId: r.courierId, fullName: r.fullName, phone: r.phone,
        pendingMinor: r.pendingMinor ?? 0, entries: r.entries,
      }] : [])),
      200,
    );
  },
);

platformAdminRoutes.openapi(
  createRoute({
    method: "post",
    path: "/payouts/settle",
    tags: ["platform-admin"],
    security: bearerSecurity,
    request: {
      body: jsonContent(z.object({ courierId: IdSchema }), "Courier to settle"),
    },
    responses: {
      200: jsonContent(
        z.object({
          courierId: IdSchema,
          settledMinor: z.number().int(),
          entries: z.number().int(),
          settlementRef: z.string(),
          transferred: z.boolean(),
        }),
        "Settlement result",
      ),
      ...errorResponses,
    },
  }),
  async (c) => {
    const { courierId } = c.req.valid("json");

    const pending = await db
      .select()
      .from(payoutLedger)
      .where(and(
        eq(payoutLedger.courierId, courierId),
        eq(payoutLedger.entryType, "courier_payout"),
        eq(payoutLedger.status, "pending"),
      ));
    if (pending.length === 0) throw badRequest("NOTHING_PENDING", "Courier has no pending payouts");
    const total = pending.reduce((s, e) => s + e.amountMinor, 0);

    // Push the money first when Disbursements is configured — a crash after
    // transfer but before the DB update is visible via the transfer ref log
    // and re-settlement is guarded by status=pending.
    const { momoDisbursements } = await import("../services/payments/momo-disbursements");
    let settlementRef = "manual";
    let transferred = false;
    if (momoDisbursements.isConfigured) {
      const [row] = await db
        .select({ phone: users.phone })
        .from(couriers)
        .innerJoin(users, eq(couriers.userId, users.id))
        .where(eq(couriers.id, courierId))
        .limit(1);
      if (!row) throw notFound("Courier");
      settlementRef = await momoDisbursements.transfer({
        amountMinor: total,
        currency: "ZMW",
        payeePhone: row.phone,
        note: `CampusCart payout (${pending.length} deliveries)`,
      });
      transferred = true;
    }

    const settled = await db
      .update(payoutLedger)
      .set({ status: "settled", settlementRef, settledAt: new Date() })
      .where(and(
        eq(payoutLedger.courierId, courierId),
        eq(payoutLedger.entryType, "courier_payout"),
        eq(payoutLedger.status, "pending"),
      ))
      .returning();

    logger.info("payout.settled", { courierId, entries: settled.length, total, settlementRef });
    return c.json({
      courierId, settledMinor: total, entries: settled.length, settlementRef, transferred,
    }, 200);
  },
);
