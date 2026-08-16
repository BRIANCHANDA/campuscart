import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type { InitiatedPayment, InitiatePaymentInput, PaymentProvider } from "./provider";

/**
 * MTN Mobile Money — Collections API ("request-to-pay").
 *
 * Flow: we POST a requesttopay with a UUID we mint (X-Reference-Id, stored as
 * our providerRef); MTN pushes an approval prompt to the payer's handset; the
 * outcome arrives on our callback URL (and can be polled as a fallback).
 *
 * Sandbox base is https://sandbox.momodeveloper.mtn.com; production hosts are
 * per-market (Zambia: momodeveloper.mtn.com with target env `mtnzambia`).
 * ⚠️ Confirm the target environment string and callback registration in the
 * MTN developer portal for the production onboarding.
 *
 * Amount note: the Collections API takes amounts in MAJOR units as a string
 * ("55.00"), unlike Stripe's minor units — conversion happens here at the
 * boundary so the rest of the system stays in ngwee.
 */
export class MtnMomoProvider implements PaymentProvider {
  readonly name = "mtn_momo" as const;

  private token: { value: string; expiresAt: number } | null = null;

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      "Ocp-Apim-Subscription-Key": env.MOMO_SUBSCRIPTION_KEY,
      "X-Target-Environment": env.MOMO_TARGET_ENVIRONMENT,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  /** OAuth token, cached until ~1 min before expiry. */
  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;

    const basic = btoa(`${env.MOMO_API_USER}:${env.MOMO_API_KEY}`);
    const res = await fetch(`${env.MOMO_API_BASE_URL}/collection/token/`, {
      method: "POST",
      headers: this.headers({ Authorization: `Basic ${basic}` }),
    });
    if (!res.ok) {
      logger.error("momo.token.error", { status: res.status });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "MoMo authentication failed");
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return this.token.value;
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatedPayment> {
    const referenceId = crypto.randomUUID(); // becomes our providerRef
    const token = await this.accessToken();

    // MoMo's SANDBOX only accepts EUR (and Nordic test MSISDNs); production
    // takes the real currency. Override only when targeting sandbox so live
    // ZMW charges are never touched.
    const sandbox = env.MOMO_TARGET_ENVIRONMENT === "sandbox";
    const currency = sandbox ? "EUR" : input.currency;

    const res = await fetch(`${env.MOMO_API_BASE_URL}/collection/v1_0/requesttopay`, {
      method: "POST",
      headers: this.headers({
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": referenceId,
        ...(env.MOMO_CALLBACK_URL ? { "X-Callback-Url": env.MOMO_CALLBACK_URL } : {}),
      }),
      body: JSON.stringify({
        amount: (input.amountMinor / 100).toFixed(2), // MAJOR units (kwacha)
        currency,
        // externalId round-trips through the callback — it's how we correlate,
        // since MoMo's callback body does not echo X-Reference-Id.
        externalId: referenceId,
        payer: { partyIdType: "MSISDN", partyId: input.customerPhone.replace(/^\+/, "") },
        payerMessage: `CampusCart order ${input.orderId.slice(0, 8)}`,
        payeeNote: input.orderId,
      }),
    });

    if (res.status !== 202) {
      // Capture MoMo's error body so failures are diagnosable, not just a status.
      const detail = await res.text().catch(() => "");
      logger.error("momo.requesttopay.error", { status: res.status, orderId: input.orderId, detail: detail.slice(0, 300) });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "MoMo request-to-pay failed");
    }

    logger.info("payment.initiated", { provider: "mtn_momo", orderId: input.orderId, ref: referenceId });
    // The payer approves on their handset — nothing for the app to complete,
    // so no clientSecret; the order screen waits on the payment.update push.
    return { providerRef: referenceId, clientSecret: null, status: "pending" };
  }

  /**
   * Callback body mirrors the requesttopay resource:
   *   { externalId, amount, currency, payer, status: "SUCCESSFUL"|"FAILED", reason? }
   * MoMo does not sign callbacks; authenticity comes from the callback URL
   * being registered per-app in the MTN portal (plus our unguessable path).
   * Defense-in-depth: we only ever update a payment row whose providerRef
   * (=== externalId, a UUID we minted) already exists.
   */
  async parseWebhook(rawBody: string, _signature: string | undefined) {
    let body: { externalId?: string; status?: string; reason?: unknown };
    try {
      body = JSON.parse(rawBody) as typeof body;
    } catch {
      throw new AppError(400, "BAD_WEBHOOK", "MoMo callback body is not JSON");
    }
    if (!body.externalId || !body.status) {
      throw new AppError(400, "BAD_WEBHOOK", "MoMo callback missing externalId/status");
    }

    const map: Record<string, "succeeded" | "failed"> = {
      SUCCESSFUL: "succeeded",
      FAILED: "failed",
    };
    const status = map[body.status];
    if (!status) throw new AppError(400, "UNHANDLED_EVENT", `Unhandled MoMo status ${body.status}`);
    return { providerRef: body.externalId, status };
  }

  /** Poll fallback for reconciliation jobs / support tooling. */
  async fetchStatus(providerRef: string): Promise<"pending" | "succeeded" | "failed"> {
    const token = await this.accessToken();
    const res = await fetch(
      `${env.MOMO_API_BASE_URL}/collection/v1_0/requesttopay/${providerRef}`,
      { headers: this.headers({ Authorization: `Bearer ${token}` }) },
    );
    if (!res.ok) throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "MoMo status query failed");
    const data = (await res.json()) as { status: "PENDING" | "SUCCESSFUL" | "FAILED" };
    return data.status === "SUCCESSFUL" ? "succeeded" : data.status === "FAILED" ? "failed" : "pending";
  }

  async refund(providerRef: string, amountMinor: number): Promise<void> {
    // Refunds ride MTN's Disbursements product. We look up the original
    // payer's MSISDN from the collection resource, then push the money back.
    // The payout rail is whatever the gateway selects; the MSISDN lookup below
    // still has to come from MoMo, since that is where the collection lives.
    const { disbursementProvider } = await import("./gateway");
    const payouts = disbursementProvider();
    if (!payouts.isConfigured) {
      throw new AppError(
        502,
        "REFUND_NOT_SUPPORTED",
        "Refunds require a configured payout provider — process this one manually",
      );
    }
    const token = await this.accessToken();
    const res = await fetch(
      `${env.MOMO_API_BASE_URL}/collection/v1_0/requesttopay/${providerRef}`,
      { headers: this.headers({ Authorization: `Bearer ${token}` }) },
    );
    if (!res.ok) throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Could not load original payment");
    const original = (await res.json()) as { payer?: { partyId?: string }; currency?: string };
    if (!original.payer?.partyId) {
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Original payment has no payer MSISDN");
    }
    await payouts.transfer({
      amountMinor,
      currency: original.currency ?? "ZMW",
      payeePhone: original.payer.partyId,
      note: `CampusCart refund ${providerRef.slice(0, 8)}`,
    });
  }
}
