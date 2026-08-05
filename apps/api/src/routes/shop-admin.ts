import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, desc, eq, gte, inArray, sql, sum, type SQL } from "drizzle-orm";
import {
  CreateProductSchema, IdSchema, OrderListQuerySchema, OrderSchema, paginated,
  ProductSchema, ShopSchema, UpdateOrderStatusSchema, UpdateProductSchema, UpdateShopSchema,
} from "@campuscart/shared";
import { db } from "../db";
import { orderItems, orders, products, shops } from "../db/schema";
import { badRequest, notFound } from "../lib/errors";
import { requireAuth, requireRole, requireShopOwnership } from "../middleware/auth";
import { bearerSecurity, errorResponses, jsonContent } from "../lib/openapi";
import { pipeline } from "../services/instances";
import { assignCourier } from "../services/couriers/assignment";
import { serializeOrder } from "./orders";
import { serializeShop } from "./shops";

/**
 * Everything here is tenant-scoped: requireShopOwnership guarantees the
 * :shopId in the path belongs to the authenticated admin. One admin can
 * never see or touch another shop's data.
 */
export const shopAdminRoutes = new OpenAPIHono();
shopAdminRoutes.use("/:shopId/*", requireAuth, requireRole("shop_admin"), requireShopOwnership);

const shopParam = z.object({ shopId: IdSchema });

const ShopStatsSchema = z.object({
  todayOrders: z.number().int(),
  todayRevenueMinor: z.number().int(),
  activeOrders: z.number().int(),
  lifetimeOrders: z.number().int(),
  lifetimeRevenueMinor: z.number().int(),
  totalProducts: z.number().int(),
  lowStock: z.number().int(),
  outOfStock: z.number().int(),
});

const ACTIVE_STATUSES = ["placed", "preparing", "ready_for_pickup", "out_for_delivery"] as const;

// Business day boundary — Zambia has no DST, so a fixed offset is exact. All
// "today"/daily bucketing happens in this zone so a 9pm order lands on the
// right calendar day for the owner, not a UTC one.
const BUSINESS_TZ = "Africa/Lusaka";
/** True when an order's calendar day (in business TZ) equals today's. */
const isToday = sql`(${orders.createdAt} AT TIME ZONE ${BUSINESS_TZ})::date = (now() AT TIME ZONE ${BUSINESS_TZ})::date`;

/** GET /admin/shops/{shopId}/stats — at-a-glance monitoring for the shop dashboard. */
shopAdminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{shopId}/stats",
    tags: ["shop-admin"],
    security: bearerSecurity,
    request: { params: shopParam },
    responses: { 200: jsonContent(ShopStatsSchema, "Shop stats"), ...errorResponses },
  }),
  async (c) => {
    const { shopId } = c.req.valid("param");
    // Revenue counts non-cancelled orders only.
    const notCancelled = sql`${orders.status} <> 'cancelled'`;

    const [today, lifetime, active, prod] = await Promise.all([
      db.select({ n: count(), rev: sum(orders.totalMinor).mapWith(Number) })
        .from(orders)
        .where(and(eq(orders.shopId, shopId), isToday, notCancelled)),
      db.select({ n: count(), rev: sum(orders.totalMinor).mapWith(Number) })
        .from(orders)
        .where(and(eq(orders.shopId, shopId), notCancelled)),
      db.select({ n: count() })
        .from(orders)
        .where(and(eq(orders.shopId, shopId), inArray(orders.status, [...ACTIVE_STATUSES]))),
      db.select({
        total: count(),
        low: sql<number>`count(*) filter (where ${products.stockQty} > 0 and ${products.stockQty} <= 5)`.mapWith(Number),
        out: sql<number>`count(*) filter (where ${products.stockQty} = 0)`.mapWith(Number),
      }).from(products).where(eq(products.shopId, shopId)),
    ]);

    return c.json({
      todayOrders: today[0]?.n ?? 0,
      todayRevenueMinor: today[0]?.rev ?? 0,
      activeOrders: active[0]?.n ?? 0,
      lifetimeOrders: lifetime[0]?.n ?? 0,
      lifetimeRevenueMinor: lifetime[0]?.rev ?? 0,
      totalProducts: prod[0]?.total ?? 0,
      lowStock: prod[0]?.low ?? 0,
      outOfStock: prod[0]?.out ?? 0,
    }, 200);
  },
);

const AnalyticsSchema = z.object({
  rangeDays: z.number().int(),
  totalOrders: z.number().int(),
  totalRevenueMinor: z.number().int(),
  avgOrderValueMinor: z.number().int(),
  series: z.array(z.object({
    date: z.string(),            // YYYY-MM-DD
    orders: z.number().int(),
    revenueMinor: z.number().int(),
  })),
  topProducts: z.array(z.object({
    productId: IdSchema,
    name: z.string(),
    units: z.number().int(),
    revenueMinor: z.number().int(),
  })),
});

/**
 * GET /admin/shops/{shopId}/analytics?days=30 — trend + product breakdown.
 * Daily revenue/order series (gap-filled) and the shop's best-selling products
 * over the window. Cancelled orders are excluded from money.
 */
shopAdminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{shopId}/analytics",
    tags: ["shop-admin"],
    security: bearerSecurity,
    request: {
      params: shopParam,
      query: z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }),
    },
    responses: { 200: jsonContent(AnalyticsSchema, "Shop analytics"), ...errorResponses },
  }),
  async (c) => {
    const { shopId } = c.req.valid("param");
    const { days } = c.req.valid("query");

    // Orders whose business-day is within the last `days` days (inclusive of today).
    const bizDay = sql`(${orders.createdAt} AT TIME ZONE ${BUSINESS_TZ})::date`;
    const windowStart = sql`(now() AT TIME ZONE ${BUSINESS_TZ})::date - ${days - 1}`;
    const inWindow = and(eq(orders.shopId, shopId), sql`${bizDay} >= ${windowStart}`, sql`${orders.status} <> 'cancelled'`);

    // Daily series, gap-filled in SQL via generate_series so there are never holes.
    const seriesRows = await db.execute(sql`
      with days as (
        select generate_series(${windowStart}, (now() at time zone ${BUSINESS_TZ})::date, interval '1 day')::date as d
      ),
      agg as (
        select (o.created_at at time zone ${BUSINESS_TZ})::date as d,
               count(*) as orders, coalesce(sum(o.total_minor), 0) as revenue
        from orders o
        where o.shop_id = ${shopId}::uuid and o.status <> 'cancelled'
          and (o.created_at at time zone ${BUSINESS_TZ})::date >= ${windowStart}
        group by 1
      )
      select to_char(days.d, 'YYYY-MM-DD') as date,
             coalesce(agg.orders, 0)::int as orders,
             coalesce(agg.revenue, 0)::int as revenue
      from days left join agg using (d)
      order by days.d
    `);

    const productRows = await db.select({
      productId: orderItems.productId,
      name: orderItems.productName,
      units: sum(orderItems.qty).mapWith(Number),
      revenue: sql<number>`sum(${orderItems.unitPriceMinor} * ${orderItems.qty})`.mapWith(Number),
    }).from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(inWindow)
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.unitPriceMinor} * ${orderItems.qty})`))
      .limit(10);

    const series = (seriesRows as unknown as { date: string; orders: number; revenue: number }[])
      .map((r) => ({ date: r.date, orders: Number(r.orders), revenueMinor: Number(r.revenue) }));
    const totalOrders = series.reduce((s, d) => s + d.orders, 0);
    const totalRevenueMinor = series.reduce((s, d) => s + d.revenueMinor, 0);

    return c.json({
      rangeDays: days,
      totalOrders,
      totalRevenueMinor,
      avgOrderValueMinor: totalOrders > 0 ? Math.round(totalRevenueMinor / totalOrders) : 0,
      series,
      topProducts: productRows.map((p) => ({
        productId: p.productId, name: p.name, units: p.units ?? 0, revenueMinor: p.revenue ?? 0,
      })),
    }, 200);
  },
);

/** GET /admin/shops — the shops this admin manages (drives tenant selection in the app). */
shopAdminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["shop-admin"],
    security: bearerSecurity,
    middleware: [requireAuth, requireRole("shop_admin")] as const,
    responses: {
      200: jsonContent(z.array(ShopSchema), "Shops managed by the authenticated admin"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const shopIds = c.get("claims").shopIds ?? [];
    if (shopIds.length === 0) return c.json([], 200);
    const rows = await db.select().from(shops).where(inArray(shops.id, shopIds));
    return c.json(rows.map(serializeShop), 200);
  },
);

/** PATCH /admin/shops/{shopId} — owners edit their own shop's details from the app. */
shopAdminRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/{shopId}",
    tags: ["shop-admin"],
    security: bearerSecurity,
    // The use("/:shopId/*") gate doesn't match the bare /:shopId path — guard inline.
    middleware: [requireAuth, requireRole("shop_admin"), requireShopOwnership] as const,
    request: {
      params: shopParam,
      body: jsonContent(UpdateShopSchema.omit({ isActive: true }), "Shop details"),
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
      })
      .where(eq(shops.id, shopId))
      .returning();
    if (!shop) throw notFound("Shop");
    return c.json(serializeShop(shop), 200);
  },
);

const serializeProduct = (p: typeof products.$inferSelect) => ({
  id: p.id,
  shopId: p.shopId,
  name: p.name,
  description: p.description,
  category: p.category,
  priceMinor: p.priceMinor,
  currency: p.currency as "ZMW" | "USD",
  stockQty: p.stockQty,
  imageUrl: p.imageUrl,
  isActive: p.isActive,
});

// --- Catalog / inventory ----------------------------------------------------
shopAdminRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{shopId}/products",
    tags: ["shop-admin"],
    security: bearerSecurity,
    request: { params: shopParam, body: jsonContent(CreateProductSchema, "New product") },
    responses: { 201: jsonContent(ProductSchema, "Created"), ...errorResponses },
  }),
  async (c) => {
    const { shopId } = c.req.valid("param");
    const body = c.req.valid("json");
    const [p] = await db.insert(products).values({ ...body, shopId }).returning();
    if (!p) throw new Error("product insert failed");
    return c.json(serializeProduct(p), 201);
  },
);

shopAdminRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/{shopId}/products/{productId}",
    tags: ["shop-admin"],
    security: bearerSecurity,
    request: {
      params: shopParam.extend({ productId: IdSchema }),
      body: jsonContent(UpdateProductSchema, "Fields to update"),
    },
    responses: { 200: jsonContent(ProductSchema, "Updated"), ...errorResponses },
  }),
  async (c) => {
    const { shopId, productId } = c.req.valid("param");
    const body = c.req.valid("json");
    // shopId in the WHERE clause = tenant isolation at the query layer
    const [p] = await db
      .update(products)
      .set(body)
      .where(and(eq(products.id, productId), eq(products.shopId, shopId)))
      .returning();
    if (!p) throw notFound("Product");
    return c.json(serializeProduct(p), 200);
  },
);

shopAdminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{shopId}/products",
    tags: ["shop-admin"],
    security: bearerSecurity,
    request: {
      params: shopParam,
      query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      }),
    },
    responses: { 200: jsonContent(paginated(ProductSchema), "Catalog"), ...errorResponses },
  }),
  async (c) => {
    const { shopId } = c.req.valid("param");
    const q = c.req.valid("query");
    const where = eq(products.shopId, shopId);
    const [rows, countRows] = await Promise.all([
      db.select().from(products).where(where).limit(q.pageSize).offset((q.page - 1) * q.pageSize),
      db.select({ total: count() }).from(products).where(where),
    ]);
    const total = countRows[0]?.total ?? 0;
    return c.json({
      data: rows.map(serializeProduct), page: q.page, pageSize: q.pageSize, total,
      totalPages: Math.ceil(total / q.pageSize),
    }, 200);
  },
);

// --- Incoming orders ----------------------------------------------------------
shopAdminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{shopId}/orders",
    tags: ["shop-admin"],
    security: bearerSecurity,
    request: { params: shopParam, query: OrderListQuerySchema },
    responses: { 200: jsonContent(paginated(OrderSchema), "Incoming orders"), ...errorResponses },
  }),
  async (c) => {
    const { shopId } = c.req.valid("param");
    const q = c.req.valid("query");
    const filters: SQL[] = [eq(orders.shopId, shopId)];
    if (q.status) filters.push(eq(orders.status, q.status));
    const where = and(...filters);
    const [rows, countRows] = await Promise.all([
      db.select().from(orders).where(where).orderBy(desc(orders.createdAt))
        .limit(q.pageSize).offset((q.page - 1) * q.pageSize),
      db.select({ total: count() }).from(orders).where(where),
    ]);
    const total = countRows[0]?.total ?? 0;
    const data = await Promise.all(rows.map((o) => serializeOrder(o.id)));
    return c.json({
      data, page: q.page, pageSize: q.pageSize, total,
      totalPages: Math.ceil(total / q.pageSize),
    }, 200);
  },
);

/**
 * Update fulfillment status. Transitions run through the shared state machine.
 * Moving preparing → out_for_delivery happens via /dispatch, not here.
 */
shopAdminRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/{shopId}/orders/{orderId}/status",
    tags: ["shop-admin"],
    security: bearerSecurity,
    request: {
      params: shopParam.extend({ orderId: IdSchema }),
      body: jsonContent(UpdateOrderStatusSchema, "Target status"),
    },
    responses: { 200: jsonContent(OrderSchema, "Updated order"), ...errorResponses },
  }),
  async (c) => {
    const { shopId, orderId } = c.req.valid("param");
    const { status } = c.req.valid("json");
    const claims = c.get("claims");

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.shopId, shopId)))
      .limit(1);
    if (!order) throw notFound("Order");

    await pipeline.transition({ orderId, to: status, actor: "shop_admin", actorUserId: claims.sub });
    return c.json(await serializeOrder(orderId), 200);
  },
);

/** Shop confirms it's ready → dispatch to Yango + link an available verified courier. */
shopAdminRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{shopId}/orders/{orderId}/dispatch",
    tags: ["shop-admin"],
    security: bearerSecurity,
    request: { params: shopParam.extend({ orderId: IdSchema }) },
    responses: {
      200: jsonContent(z.object({ yangoRequestId: z.string(), courierId: IdSchema }), "Dispatched"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const { shopId, orderId } = c.req.valid("param");
    const claims = c.get("claims");

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.shopId, shopId)))
      .limit(1);
    if (!order) throw notFound("Order");

    // Nearest available verified courier to the shop's pickup point
    // (couriers without a fresh location fall back behind located ones).
    const [shop] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (!shop) throw notFound("Shop");
    const courier = await assignCourier(db, { lat: shop.pickupLat, lng: shop.pickupLng });

    const { yangoRequestId } = await pipeline.dispatch({
      orderId, courierId: courier.id, actorUserId: claims.sub,
    });
    return c.json({ yangoRequestId, courierId: courier.id }, 200);
  },
);
