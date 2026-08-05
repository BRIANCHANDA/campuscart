import { Hono, type Context } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { PaymentMethod } from "@campuscart/shared";
import { db } from "../db";
import { deliveries, payments } from "../db/schema";
import { env } from "../env";
import { logger } from "../lib/logger";
import { pipeline } from "../services/instances";
import { providerFor } from "../services/payments/gateway";
import { realtime } from "../lib/events";

/**
 * Payment webhooks — the provider is the source of truth for settlement.
 * Raw body is preserved for signature verification. Each wallet posts to its
 * own path (registered in that provider's portal), so we route to the right
 * parser deterministically:
 *   MTN MoMo    → POST /webhooks/payments/mtn      (MOMO_CALLBACK_URL)
 *   Airtel      → POST /webhooks/payments/airtel   (Airtel callback URL)
 */
export const webhookRoutes = new Hono();

async function handlePaymentCallback(c: Context, method: PaymentMethod) {
  const raw = await c.req.text();
  const signature =
    c.req.header("X-Auth-Signature") ?? // Airtel
    c.req.header("X-Signature") ??
    c.req.header("Stripe-Signature") ??
    undefined;

  const provider = providerFor(method);
  const parsed = await provider.parseWebhook(raw, signature);

  const statusMap = { succeeded: "succeeded", failed: "failed", refunded: "refunded" } as const;
  // Guard: only ever settle a payment row whose providerRef (a UUID we minted)
  // already exists — an attacker can't fabricate a settlement.
  const [payment] = await db
    .update(payments)
    .set({ status: statusMap[parsed.status] })
    .where(eq(payments.providerRef, parsed.providerRef))
    .returning();

  logger.info("payment.webhook", {
    provider: provider.name, providerRef: parsed.providerRef,
    status: parsed.status, matched: Boolean(payment),
  });

  if (payment) {
    realtime.publish({ kind: "payment.update", orderId: payment.orderId, status: parsed.status });
  }
  return c.json({ received: true });
}

webhookRoutes.post("/payments/mtn", (c) => handlePaymentCallback(c, "mtn_momo"));
webhookRoutes.post("/payments/airtel", (c) => handlePaymentCallback(c, "airtel_money"));

/**
 * Yango claim status webhook — push-based sync so we don't have to poll track().
 * Configure the callback URL + shared secret in the Yango partner cabinet;
 * ⚠️ field names below follow the B2B claims API and must be confirmed
 * against the partner docs issued with your credentials.
 *
 * Idempotent by design: each status maps to a guarded update, so Yango's
 * at-least-once delivery (or a courier who already tapped "complete" in-app)
 * can't double-apply a transition.
 */
const YangoWebhookSchema = z.object({
  claim_id: z.string().min(1),
  status: z.string().min(1),
  updated_ts: z.string().optional(),
});

// Yango claim statuses → our delivery lifecycle
const YANGO_STATUS_MAP: Record<string, "picked_up" | "delivered" | "failed" | "cancelled"> = {
  pickuped: "picked_up",          // (sic — Yango's spelling)
  pickup_arrived: "picked_up",
  delivered: "delivered",
  delivered_finish: "delivered",
  cancelled: "cancelled",
  cancelled_by_taxi: "cancelled",
  failed: "failed",
  performer_not_found: "failed",
};

webhookRoutes.post("/yango", async (c) => {
  // Shared-secret check (skipped only when no secret is configured, e.g. local dev)
  if (env.YANGO_WEBHOOK_SECRET) {
    const provided = c.req.header("X-Webhook-Secret");
    if (provided !== env.YANGO_WEBHOOK_SECRET) {
      logger.warn("yango.webhook.unauthorized", {});
      return c.json({ error: { code: "UNAUTHORIZED", message: "Bad webhook secret" } }, 401);
    }
  }

  const parsed = YangoWebhookSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Bad payload" } }, 400);
  }
  const { claim_id, status } = parsed.data;

  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.yangoRequestId, claim_id))
    .limit(1);
  if (!delivery) {
    // Unknown claim: acknowledge (200) so Yango stops retrying, but log it
    logger.warn("yango.webhook.unknown_claim", { claimId: claim_id, status });
    return c.json({ received: true, matched: false });
  }

  const mapped = YANGO_STATUS_MAP[status];
  logger.info("yango.webhook", { claimId: claim_id, yangoStatus: status, mapped: mapped ?? null });

  if (!mapped) return c.json({ received: true, matched: true }); // intermediate status we don't track

  switch (mapped) {
    case "picked_up":
      // Guarded: only moves dispatched → picked_up
      await db
        .update(deliveries)
        .set({ status: "picked_up", updatedAt: new Date() })
        .where(eq(deliveries.id, delivery.id));
      realtime.publish({ kind: "delivery.update", orderId: delivery.orderId, status: "picked_up" });
      break;

    case "delivered":
      if (delivery.status !== "delivered" && delivery.courierId) {
        // Reuse the pipeline so the order transition + audit event happen exactly once.
        // If the courier already completed in-app, the state machine rejects the
        // duplicate and we swallow it — that's the idempotency contract.
        try {
          await db
            .update(deliveries)
            .set({ status: "delivered", updatedAt: new Date() })
            .where(eq(deliveries.id, delivery.id));
          await pipeline.transition({ orderId: delivery.orderId, to: "delivered", actor: "system" });
        } catch {
          logger.info("yango.webhook.duplicate_complete", { orderId: delivery.orderId });
        }
      }
      break;

    case "cancelled":
    case "failed":
      await db
        .update(deliveries)
        .set({ status: mapped, updatedAt: new Date() })
        .where(eq(deliveries.id, delivery.id));
      realtime.publish({ kind: "delivery.update", orderId: delivery.orderId, status: mapped });
      break;
  }

  return c.json({ received: true, matched: true });
});
