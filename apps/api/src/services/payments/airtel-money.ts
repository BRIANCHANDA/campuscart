import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type { InitiatedPayment, InitiatePaymentInput, PaymentProvider } from "./provider";

/**
 * Airtel Money — merchant "push payment" (USSD approval on the payer's
 * handset), the second half of the Zambian mobile-money duopoly.
 *
 * Flow mirrors MoMo: we POST a payment with a transaction id we mint (our
 * providerRef), Airtel prompts the subscriber, and the outcome lands on our
 * registered callback (status_code TS = success, TF = failure).
 *
 * ⚠️ Confirm the production host, country/currency enablement (ZM/ZMW), and
 * callback registration in the Airtel developers portal during onboarding.
 * Amounts are MAJOR units, converted here at the boundary.
 */
export class AirtelMoneyProvider implements PaymentProvider {
  readonly name = "airtel_money" as const;

  private token: { value: string; expiresAt: number } | null = null;

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;

    const res = await fetch(`${env.AIRTEL_API_BASE_URL}/auth/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.AIRTEL_CLIENT_ID,
        client_secret: env.AIRTEL_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });
    if (!res.ok) {
      logger.error("airtel.token.error", { status: res.status });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Airtel authentication failed");
    }
    const data = (await res.json()) as { access_token: string; expires_in: number | string };
    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + Number(data.expires_in) * 1000,
    };
    return this.token.value;
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatedPayment> {
    const transactionId = crypto.randomUUID(); // our providerRef
    const token = await this.accessToken();

    // Airtel expects the national subscriber number (no country code prefix)
    const msisdn = input.customerPhone.replace(/^\+?260/, "");

    const res = await fetch(`${env.AIRTEL_API_BASE_URL}/merchant/v1/payments/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Country": env.AIRTEL_COUNTRY,
        "X-Currency": input.currency,
      },
      body: JSON.stringify({
        reference: `CampusCart order ${input.orderId.slice(0, 8)}`,
        subscriber: { country: env.AIRTEL_COUNTRY, currency: input.currency, msisdn },
        transaction: {
          amount: input.amountMinor / 100, // MAJOR units (kwacha)
          country: env.AIRTEL_COUNTRY,
          currency: input.currency,
          id: transactionId,
        },
      }),
    });

    if (!res.ok) {
      logger.error("airtel.payment.error", { status: res.status, orderId: input.orderId });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Airtel push payment failed");
    }

    logger.info("payment.initiated", { provider: "airtel_money", orderId: input.orderId, ref: transactionId });
    return { providerRef: transactionId, clientSecret: null, status: "pending" };
  }

  /**
   * Callback shape:
   *   { transaction: { id, message, status_code: "TS"|"TF", airtel_money_id } }
   * `transaction.id` is the UUID we minted at initiate.
   * If a signature secret is configured in the portal, Airtel sends a hash
   * header — verified here when AIRTEL_CALLBACK_SECRET is set; otherwise the
   * same defense as MoMo applies (only pre-existing providerRefs update).
   */
  async parseWebhook(rawBody: string, signature: string | undefined) {
    if (env.AIRTEL_CALLBACK_SECRET) {
      const { createHmac, timingSafeEqual } = await import("node:crypto");
      const expected = createHmac("sha256", env.AIRTEL_CALLBACK_SECRET).update(rawBody).digest("hex");
      const provided = Buffer.from(signature ?? "", "utf8");
      const wanted = Buffer.from(expected, "utf8");
      if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
        throw new AppError(401, "BAD_SIGNATURE", "Airtel callback signature verification failed");
      }
    }

    let body: { transaction?: { id?: string; status_code?: string } };
    try {
      body = JSON.parse(rawBody) as typeof body;
    } catch {
      throw new AppError(400, "BAD_WEBHOOK", "Airtel callback body is not JSON");
    }
    const tx = body.transaction;
    if (!tx?.id || !tx.status_code) {
      throw new AppError(400, "BAD_WEBHOOK", "Airtel callback missing transaction id/status");
    }

    const map: Record<string, "succeeded" | "failed"> = { TS: "succeeded", TF: "failed" };
    const status = map[tx.status_code];
    if (!status) throw new AppError(400, "UNHANDLED_EVENT", `Unhandled Airtel status ${tx.status_code}`);
    return { providerRef: tx.id, status };
  }

  async refund(providerRef: string, _amountMinor: number): Promise<void> {
    const token = await this.accessToken();
    const res = await fetch(`${env.AIRTEL_API_BASE_URL}/standard/v1/payments/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Country": env.AIRTEL_COUNTRY,
        "X-Currency": "ZMW",
      },
      body: JSON.stringify({ transaction: { airtel_money_id: providerRef } }),
    });
    if (!res.ok) throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Airtel refund failed");
  }
}
