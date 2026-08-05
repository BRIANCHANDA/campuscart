import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { CheckoutRequestSchema, OrderSchema } from "@campuscart/shared";
import { db } from "../db";
import { users } from "../db/schema";
import { notFound } from "../lib/errors";
import { withIdempotency } from "../lib/idempotency";
import { requireAuth, requireRole } from "../middleware/auth";
import { bearerSecurity, errorResponses, jsonContent } from "../lib/openapi";
import { serializeOrder } from "./orders";
import { pipeline } from "../services/instances";

export const checkoutRoutes = new OpenAPIHono();
checkoutRoutes.use("*", requireAuth, requireRole("shopper"));

const CheckoutResponseSchema = z.object({
  order: OrderSchema,
  payment: z.object({
    id: z.string().uuid(),
    provider: z.string(),
    status: z.string(),
    clientSecret: z.string().nullable(),
  }),
  replayed: z.boolean(),
});

/**
 * POST /checkout — requires an Idempotency-Key header.
 * Same key + user replays the original response instead of double-charging.
 */
checkoutRoutes.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["checkout"],
    security: bearerSecurity,
    request: {
      headers: z.object({ "idempotency-key": z.string().min(8) }),
      body: jsonContent(CheckoutRequestSchema, "Checkout payload"),
    },
    responses: { 201: jsonContent(CheckoutResponseSchema, "Order placed"), ...errorResponses },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const claims = c.get("claims");

    const [user] = await db.select().from(users).where(eq(users.id, claims.sub)).limit(1);
    if (!user) throw notFound("User");

    const result = await withIdempotency(
      db,
      { key: c.req.header("Idempotency-Key"), userId: claims.sub, endpoint: "POST /checkout" },
      async () => {
        const { order, payment, clientSecret } = await pipeline.checkout({
          userId: claims.sub,
          userEmail: user.email,
          userPhone: user.phone,
          cartId: body.cartId,
          fulfillmentType: body.fulfillmentType,
          dropoff: body.dropoff,
          dropoffAddress: body.dropoffAddress,
          paymentMethod: body.paymentMethod,
          payerPhone: body.payerPhone,
        });
        return {
          status: 201,
          body: {
            order: await serializeOrder(order.id),
            payment: {
              id: payment?.id ?? "",
              provider: payment?.provider ?? "mock",
              status: payment?.status ?? "pending",
              clientSecret,
            },
          },
        };
      },
    );

    return c.json({ ...result.body, replayed: result.replayed }, 201);
  },
);
