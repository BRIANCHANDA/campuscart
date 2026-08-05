import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import {
  DeliverySchema, IdSchema, OrderListQuerySchema, OrderSchema, paginated,
} from "@campuscart/shared";
import { db } from "../db";
import { deliveries, orderItems, orders } from "../db/schema";
import { forbidden, notFound } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { bearerSecurity, errorResponses, jsonContent } from "../lib/openapi";

export const orderRoutes = new OpenAPIHono();
orderRoutes.use("*", requireAuth);

export async function serializeOrder(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw notFound("Order");
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return {
    id: order.id,
    shopperId: order.shopperId,
    shopId: order.shopId,
    status: order.status,
    fulfillmentType: order.fulfillmentType,
    items: items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      unitPriceMinor: i.unitPriceMinor,
      qty: i.qty,
    })),
    subtotalMinor: order.subtotalMinor,
    deliveryFeeMinor: order.deliveryFeeMinor,
    totalMinor: order.totalMinor,
    dropoff: order.dropoffLat != null && order.dropoffLng != null
      ? { lat: order.dropoffLat, lng: order.dropoffLng }
      : null,
    dropoffAddress: order.dropoffAddress,
    createdAt: order.createdAt.toISOString(),
  };
}

/** Shopper's own orders, paginated. */
orderRoutes.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["orders"],
    security: bearerSecurity,
    request: { query: OrderListQuerySchema },
    responses: { 200: jsonContent(paginated(OrderSchema), "Orders"), ...errorResponses },
  }),
  async (c) => {
    const q = c.req.valid("query");
    const claims = c.get("claims");
    const filters: SQL[] = [eq(orders.shopperId, claims.sub)];
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

orderRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{orderId}",
    tags: ["orders"],
    security: bearerSecurity,
    request: { params: z.object({ orderId: IdSchema }) },
    responses: { 200: jsonContent(OrderSchema, "Order"), ...errorResponses },
  }),
  async (c) => {
    const { orderId } = c.req.valid("param");
    const claims = c.get("claims");
    const order = await serializeOrder(orderId);
    const isOwner = order.shopperId === claims.sub;
    const isShopAdmin = claims.role === "shop_admin" && claims.shopIds?.includes(order.shopId);
    if (!isOwner && !isShopAdmin && claims.role !== "platform_admin") throw forbidden();
    return c.json(order, 200);
  },
);

/** Live tracking: order status + courier last-known location for the map. */
orderRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{orderId}/tracking",
    tags: ["orders"],
    security: bearerSecurity,
    request: { params: z.object({ orderId: IdSchema }) },
    responses: {
      200: jsonContent(z.object({ order: OrderSchema, delivery: DeliverySchema.nullable() }), "Tracking snapshot"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const { orderId } = c.req.valid("param");
    const claims = c.get("claims");
    const order = await serializeOrder(orderId);
    if (order.shopperId !== claims.sub && claims.role !== "platform_admin") throw forbidden();

    const [d] = await db.select().from(deliveries).where(eq(deliveries.orderId, orderId)).limit(1);
    return c.json({
      order,
      delivery: d
        ? {
            id: d.id,
            orderId: d.orderId,
            courierId: d.courierId,
            yangoRequestId: d.yangoRequestId,
            status: d.status,
            pickup: { lat: d.pickupLat, lng: d.pickupLng },
            dropoff: { lat: d.dropoffLat, lng: d.dropoffLng },
            feeMinor: d.feeMinor,
            courierLocation: d.courierLat != null && d.courierLng != null
              ? { lat: d.courierLat, lng: d.courierLng }
              : null,
            updatedAt: d.updatedAt.toISOString(),
          }
        : null,
    }, 200);
  },
);
