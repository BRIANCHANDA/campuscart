import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
  CoordinatesSchema, CourierSchema, DeliveryListQuerySchema, DeliverySchema, IdSchema,
  paginated, RegisterCourierSchema,
} from "@campuscart/shared";
import { db } from "../db";
import { couriers, deliveries, payoutLedger } from "../db/schema";
import { badRequest, forbidden, notFound } from "../lib/errors";
import { requireAuth, requireRole } from "../middleware/auth";
import { bearerSecurity, errorResponses, jsonContent } from "../lib/openapi";
import { pipeline } from "../services/instances";
import { realtime } from "../lib/events";

export const courierRoutes = new OpenAPIHono();
courierRoutes.use("*", requireAuth, requireRole("courier"));

const serializeDelivery = (d: typeof deliveries.$inferSelect) => ({
  id: d.id,
  orderId: d.orderId,
  courierId: d.courierId,
  yangoRequestId: d.yangoRequestId,
  status: d.status,
  pickup: { lat: d.pickupLat, lng: d.pickupLng },
  dropoff: { lat: d.dropoffLat, lng: d.dropoffLng },
  feeMinor: d.feeMinor,
  courierLocation: d.courierLat != null && d.courierLng != null
    ? { lat: d.courierLat, lng: d.courierLng } : null,
  updatedAt: d.updatedAt.toISOString(),
});

async function courierFor(userId: string) {
  const [courier] = await db.select().from(couriers).where(eq(couriers.userId, userId)).limit(1);
  if (!courier) throw notFound("Courier profile");
  return courier;
}

/** Complete/refresh courier profile (verification stays pending until admin approves). */
courierRoutes.openapi(
  createRoute({
    method: "post",
    path: "/profile",
    tags: ["courier"],
    security: bearerSecurity,
    request: { body: jsonContent(RegisterCourierSchema, "Verification details") },
    responses: { 200: jsonContent(CourierSchema, "Profile"), ...errorResponses },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const courier = await courierFor(c.get("claims").sub);
    const [updated] = await db
      .update(couriers)
      .set({ vehicleType: body.vehicleType, nrcNumber: body.nrcNumber })
      .where(eq(couriers.id, courier.id))
      .returning();
    if (!updated) throw notFound("Courier profile");
    return c.json({
      id: updated.id, userId: updated.userId, verificationStatus: updated.verificationStatus,
      isAvailable: updated.isAvailable, vehicleType: updated.vehicleType, nrcNumber: updated.nrcNumber,
    }, 200);
  },
);

/** Toggle availability for job assignment. */
courierRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/availability",
    tags: ["courier"],
    security: bearerSecurity,
    request: { body: jsonContent(z.object({ isAvailable: z.boolean() }), "Availability") },
    responses: { 200: jsonContent(z.object({ isAvailable: z.boolean() }), "Updated"), ...errorResponses },
  }),
  async (c) => {
    const { isAvailable } = c.req.valid("json");
    const courier = await courierFor(c.get("claims").sub);
    if (courier.verificationStatus !== "verified") {
      throw badRequest("NOT_VERIFIED", "Complete verification before going online");
    }
    await db.update(couriers).set({ isAvailable }).where(eq(couriers.id, courier.id));
    return c.json({ isAvailable }, 200);
  },
);

/** Jobs: unassigned deliveries waiting for a courier. */
courierRoutes.openapi(
  createRoute({
    method: "get",
    path: "/jobs",
    tags: ["courier"],
    security: bearerSecurity,
    responses: { 200: jsonContent(z.array(DeliverySchema), "Available jobs"), ...errorResponses },
  }),
  async (c) => {
    await courierFor(c.get("claims").sub);
    const rows = await db
      .select()
      .from(deliveries)
      .where(and(eq(deliveries.status, "pending_dispatch"), isNull(deliveries.courierId)))
      .orderBy(desc(deliveries.updatedAt))
      .limit(50);
    return c.json(rows.map(serializeDelivery), 200);
  },
);

/** My deliveries (history + active), paginated. */
courierRoutes.openapi(
  createRoute({
    method: "get",
    path: "/deliveries",
    tags: ["courier"],
    security: bearerSecurity,
    request: { query: DeliveryListQuerySchema },
    responses: { 200: jsonContent(paginated(DeliverySchema), "My deliveries"), ...errorResponses },
  }),
  async (c) => {
    const q = c.req.valid("query");
    const courier = await courierFor(c.get("claims").sub);
    const filters = [eq(deliveries.courierId, courier.id)];
    if (q.status) filters.push(eq(deliveries.status, q.status));
    const where = and(...filters);
    const [rows, countRows] = await Promise.all([
      db.select().from(deliveries).where(where).orderBy(desc(deliveries.updatedAt))
        .limit(q.pageSize).offset((q.page - 1) * q.pageSize),
      db.select({ total: count() }).from(deliveries).where(where),
    ]);
    const total = countRows[0]?.total ?? 0;
    return c.json({
      data: rows.map(serializeDelivery), page: q.page, pageSize: q.pageSize, total,
      totalPages: Math.ceil(total / q.pageSize),
    }, 200);
  },
);

/** Push live location while en route (feeds the shopper's tracking map). */
courierRoutes.openapi(
  createRoute({
    method: "post",
    path: "/deliveries/{deliveryId}/location",
    tags: ["courier"],
    security: bearerSecurity,
    request: {
      params: z.object({ deliveryId: IdSchema }),
      body: jsonContent(CoordinatesSchema, "Current position"),
    },
    responses: { 200: jsonContent(DeliverySchema, "Updated"), ...errorResponses },
  }),
  async (c) => {
    const { deliveryId } = c.req.valid("param");
    const pos = c.req.valid("json");
    const courier = await courierFor(c.get("claims").sub);
    // Feed proximity assignment: refresh the courier's last-known position
    await db
      .update(couriers)
      .set({ lastLat: pos.lat, lastLng: pos.lng, lastSeenAt: new Date() })
      .where(eq(couriers.id, courier.id));
    const [d] = await db
      .update(deliveries)
      .set({ courierLat: pos.lat, courierLng: pos.lng, updatedAt: new Date() })
      .where(and(eq(deliveries.id, deliveryId), eq(deliveries.courierId, courier.id)))
      .returning();
    if (!d) throw forbidden("Not your delivery");
    realtime.publish({
      kind: "delivery.update", orderId: d.orderId, courierLocation: { lat: pos.lat, lng: pos.lng },
    });
    return c.json(serializeDelivery(d), 200);
  },
);

/** Mark picked up at the shop. */
courierRoutes.openapi(
  createRoute({
    method: "post",
    path: "/deliveries/{deliveryId}/pickup",
    tags: ["courier"],
    security: bearerSecurity,
    request: { params: z.object({ deliveryId: IdSchema }) },
    responses: { 200: jsonContent(DeliverySchema, "Picked up"), ...errorResponses },
  }),
  async (c) => {
    const { deliveryId } = c.req.valid("param");
    const courier = await courierFor(c.get("claims").sub);
    const [d] = await db
      .update(deliveries)
      .set({ status: "picked_up", updatedAt: new Date() })
      .where(and(
        eq(deliveries.id, deliveryId),
        eq(deliveries.courierId, courier.id),
        eq(deliveries.status, "dispatched"),
      ))
      .returning();
    if (!d) throw badRequest("INVALID_PICKUP", "Delivery is not in a dispatchable state for you");
    realtime.publish({ kind: "delivery.update", orderId: d.orderId, status: "picked_up" });
    return c.json(serializeDelivery(d), 200);
  },
);

/** Confirm handover — completes the order through the state machine. */
courierRoutes.openapi(
  createRoute({
    method: "post",
    path: "/deliveries/{deliveryId}/complete",
    tags: ["courier"],
    security: bearerSecurity,
    request: { params: z.object({ deliveryId: IdSchema }) },
    responses: { 200: jsonContent(DeliverySchema, "Delivered"), ...errorResponses },
  }),
  async (c) => {
    const { deliveryId } = c.req.valid("param");
    const claims = c.get("claims");
    const courier = await courierFor(claims.sub);
    const [d] = await db
      .select()
      .from(deliveries)
      .where(and(eq(deliveries.id, deliveryId), eq(deliveries.courierId, courier.id)))
      .limit(1);
    if (!d) throw forbidden("Not your delivery");

    await pipeline.completeDelivery({ orderId: d.orderId, courierUserId: claims.sub });
    const [fresh] = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1);
    return c.json(serializeDelivery(fresh ?? d), 200);
  },
);

/** Payout tracking: sum of courier_payout ledger entries. */
courierRoutes.openapi(
  createRoute({
    method: "get",
    path: "/payouts",
    tags: ["courier"],
    security: bearerSecurity,
    responses: {
      200: jsonContent(z.object({
        pendingMinor: z.number().int(),
        settledMinor: z.number().int(),
      }), "Payout summary"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const courier = await courierFor(c.get("claims").sub);
    const rows = await db
      .select()
      .from(payoutLedger)
      .where(and(eq(payoutLedger.courierId, courier.id), eq(payoutLedger.entryType, "courier_payout")));
    const sum = (status: "pending" | "settled") =>
      rows.filter((r) => r.status === status).reduce((s, r) => s + r.amountMinor, 0);
    return c.json({ pendingMinor: sum("pending"), settledMinor: sum("settled") }, 200);
  },
);
