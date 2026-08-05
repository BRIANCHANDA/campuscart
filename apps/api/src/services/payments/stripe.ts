import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type { InitiatedPayment, InitiatePaymentInput, PaymentProvider } from "./provider";

/** Signature age beyond which webhooks are rejected (replay protection). */
const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Verify a Stripe-Signature header: HMAC-SHA256 over `${t}.${rawBody}` with
 * the webhook signing secret, constant-time compared against every v1
 * candidate (Stripe sends several during secret rotation).
 * Exported as a pure function so it's unit-testable without Stripe.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  const parts = new Map<string, string[]>();
  for (const kv of header.split(",")) {
    const idx = kv.indexOf("=");
    if (idx === -1) continue;
    const k = kv.slice(0, idx).trim();
    const v = kv.slice(idx + 1).trim();
    parts.set(k, [...(parts.get(k) ?? []), v]);
  }

  const t = Number(parts.get("t")?.[0]);
  const candidates = parts.get("v1") ?? [];
  if (!Number.isFinite(t) || candidates.length === 0) return false;
  if (Math.abs(nowSeconds - t) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest();
  return candidates.some((candidate) => {
    const provided = Buffer.from(candidate, "hex");
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  });
}

/**
 * Stripe via raw REST (keeps the dependency surface small under Bun).
 * PaymentIntent per order; webhook confirms settlement.
 */
export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;
  private base = "https://api.stripe.com/v1";

  private async post(path: string, form: Record<string, string>): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(form).toString(),
    });
    if (!res.ok) {
      logger.error("stripe.error", { path, status: res.status });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Payment provider request failed");
    }
    return (await res.json()) as Record<string, unknown>;
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatedPayment> {
    const intent = await this.post("/payment_intents", {
      amount: String(input.amountMinor),
      currency: input.currency.toLowerCase(),
      "metadata[orderId]": input.orderId,
      receipt_email: input.customerEmail,
    });
    logger.info("payment.initiated", { provider: "stripe", orderId: input.orderId, ref: intent.id });
    return {
      providerRef: String(intent.id),
      clientSecret: typeof intent.client_secret === "string" ? intent.client_secret : null,
      status: "pending",
    };
  }

  async parseWebhook(rawBody: string, signature: string | undefined) {
    if (!signature) throw new AppError(401, "BAD_SIGNATURE", "Missing Stripe-Signature header");
    if (!env.STRIPE_WEBHOOK_SECRET) {
      // Fail closed: never accept unverifiable webhooks in a Stripe-configured deployment
      logger.error("stripe.webhook.no_secret", {});
      throw new AppError(401, "BAD_SIGNATURE", "Webhook secret not configured");
    }
    if (!verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)) {
      logger.warn("stripe.webhook.bad_signature", {});
      throw new AppError(401, "BAD_SIGNATURE", "Stripe signature verification failed");
    }
    const event = JSON.parse(rawBody) as {
      type: string;
      data: { object: { id: string } };
    };
    const statusMap: Record<string, "succeeded" | "failed" | "refunded"> = {
      "payment_intent.succeeded": "succeeded",
      "payment_intent.payment_failed": "failed",
      "charge.refunded": "refunded",
    };
    const status = statusMap[event.type];
    if (!status) throw new AppError(400, "UNHANDLED_EVENT", `Unhandled event ${event.type}`);
    return { providerRef: event.data.object.id, status };
  }

  async refund(providerRef: string, amountMinor: number): Promise<void> {
    await this.post("/refunds", { payment_intent: providerRef, amount: String(amountMinor) });
  }
}
