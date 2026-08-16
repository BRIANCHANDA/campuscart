import type { PaymentMethod } from "@campuscart/shared";
import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type { InitiatedPayment, InitiatePaymentInput, PaymentProvider } from "./provider";

/**
 * Lenco — mobile-money collections across MTN, Airtel and Zamtel through one
 * integration, replacing the separate MTN Collections and Airtel Money clients.
 *
 * Flow matches the direct telco APIs: POST a collection with a reference we
 * mint, the customer approves on their handset (the initial status is
 * `pay-offline`, i.e. "waiting on the customer"), and the outcome arrives on
 * our webhook.
 *
 * Docs: https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-mobile-money
 *
 * Boundary conversions, all of which differ from the direct telco clients:
 *   - amount is MAJOR units as a number (13.00), not a minor-unit string
 *   - phone is the national format with a leading zero (0977433571)
 *   - the network is an explicit `operator`, not implied by the endpoint
 */

/** Networks Lenco settles in Zambia. */
export type LencoOperator = "mtn" | "airtel" | "zamtel";

/**
 * Our PaymentMethod carries the network the shopper chose, so it maps straight
 * onto Lenco's operator. Zamtel has no PaymentMethod of its own yet — adding
 * one is a shared-schema change plus a line here.
 */
export function operatorFor(method: PaymentMethod): LencoOperator {
  return method === "airtel_money" ? "airtel" : "mtn";
}

/**
 * Zambian MSISDN in the national form Lenco expects. We store E.164
 * (+260971234567); Lenco's examples are 0977433571.
 */
export function toNationalMsisdn(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const withoutCountry = digits.replace(/^260/, "");
  return withoutCountry.startsWith("0") ? withoutCountry : `0${withoutCountry}`;
}

/**
 * Lenco rejects references containing anything outside `-`, `.`, `_` and
 * alphanumerics. A v4 UUID is already within that set; this guards against a
 * future caller passing something else.
 */
const isValidReference = (ref: string): boolean => /^[A-Za-z0-9._-]+$/.test(ref);

type LencoCollection = {
  id: string;
  reference: string;
  lencoReference: string | null;
  status: string;
  reasonForFailure: string | null;
};
type LencoEnvelope<T> = { status: boolean; message: string; data: T };

/**
 * Lenco's collection lifecycle. `pay-offline` means the request is with the
 * customer's handset — the same "pending" our pipeline already models.
 */
function mapCollectionStatus(status: string): "pending" | "succeeded" | "failed" {
  switch (status) {
    case "successful":
      return "succeeded";
    case "failed":
    case "cancelled":
      return "failed";
    // pay-offline | pending | otp-required | processing
    default:
      return "pending";
  }
}

/**
 * Injectable so tests don't have to mutate the shared parsed `env` — every
 * suite runs in one process, so doing that would race with any concurrent
 * suite calling providerFor(). Production passes nothing and reads env.
 */
export type LencoConfig = { baseUrl: string; apiKey: string; feeBearer: "merchant" | "customer" };

export class LencoProvider implements PaymentProvider {
  // The gateway picks Lenco per method, so `name` reflects the wallet the
  // money actually moves on rather than the aggregator in front of it.
  readonly name: "mtn_momo" | "airtel_money";
  private readonly operator: LencoOperator;
  private readonly overrides?: Partial<LencoConfig>;

  constructor(method: PaymentMethod, overrides?: Partial<LencoConfig>) {
    this.name = method === "airtel_money" ? "airtel_money" : "mtn_momo";
    this.operator = operatorFor(method);
    this.overrides = overrides;
  }

  /** Resolved per call, so env changes at runtime are picked up. */
  private get cfg(): LencoConfig {
    return {
      baseUrl: this.overrides?.baseUrl ?? env.LENCO_API_BASE_URL,
      apiKey: this.overrides?.apiKey ?? env.LENCO_API_KEY,
      feeBearer: this.overrides?.feeBearer ?? env.LENCO_FEE_BEARER,
    };
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.cfg.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatedPayment> {
    // Our own reference is the correlation key: we mint it, so it exists in
    // the payments row before Lenco ever calls back.
    const reference = crypto.randomUUID();
    if (!isValidReference(reference)) {
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Generated an unusable Lenco reference");
    }

    const res = await fetch(`${this.cfg.baseUrl}/collections/mobile-money`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        amount: input.amountMinor / 100, // MAJOR units (kwacha)
        currency: input.currency,
        reference,
        phone: toNationalMsisdn(input.customerPhone),
        operator: this.operator,
        country: "zm",
        bearer: this.cfg.feeBearer,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.error("lenco.collection.error", {
        status: res.status, orderId: input.orderId, operator: this.operator,
        detail: detail.slice(0, 300),
      });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Mobile money request failed");
    }

    const body = (await res.json()) as LencoEnvelope<LencoCollection>;
    if (!body.status || !body.data?.reference) {
      logger.error("lenco.collection.rejected", { orderId: input.orderId, message: body.message });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Mobile money request was rejected");
    }

    const mapped = mapCollectionStatus(body.data.status);
    if (mapped === "failed") {
      logger.error("lenco.collection.failed_on_initiate", {
        orderId: input.orderId, reason: body.data.reasonForFailure,
      });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Mobile money request was declined");
    }

    logger.info("payment.initiated", {
      provider: "lenco", operator: this.operator, orderId: input.orderId,
      ref: body.data.reference, lencoReference: body.data.lencoReference,
    });

    // The customer approves on their handset, so there is nothing for the app
    // to complete — it waits on the payment.update push.
    return { providerRef: body.data.reference, clientSecret: null, status: mapped };
  }

  /**
   * Webhook body: { event, data } where event is collection.successful |
   * collection.failed | collection.settled, and data is the collection object.
   *
   * Signed with HMAC-SHA512 over the raw body in `X-Lenco-Signature`, keyed on
   * the SHA-256 hash of the API token — so no separate webhook secret to
   * configure.
   * Docs: https://lenco-api.readme.io/v2.0/reference/webhooks
   */
  async parseWebhook(rawBody: string, signature: string | undefined) {
    await verifyLencoSignature(rawBody, signature, this.cfg.apiKey);

    let body: { event?: string; data?: { reference?: string; status?: string } };
    try {
      body = JSON.parse(rawBody) as typeof body;
    } catch {
      throw new AppError(400, "BAD_WEBHOOK", "Lenco webhook body is not JSON");
    }

    const reference = body.data?.reference;
    if (!body.event || !reference) {
      throw new AppError(400, "BAD_WEBHOOK", "Lenco webhook missing event/reference");
    }

    // `collection.settled` reports OUR account being credited, which happens
    // after the customer already paid. Acting on it would be harmless but it
    // is not a payment state change, so it is deliberately not handled.
    const byEvent: Record<string, "succeeded" | "failed"> = {
      "collection.successful": "succeeded",
      "collection.failed": "failed",
    };
    const status = byEvent[body.event];
    if (!status) {
      throw new AppError(400, "UNHANDLED_EVENT", `Unhandled Lenco event ${body.event}`);
    }
    return { providerRef: reference, status };
  }

  /** Poll fallback for reconciliation, mirroring the MoMo client. */
  async fetchStatus(providerRef: string): Promise<"pending" | "succeeded" | "failed"> {
    const res = await fetch(
      `${this.cfg.baseUrl}/collections/status/${encodeURIComponent(providerRef)}`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Lenco status query failed");
    const body = (await res.json()) as LencoEnvelope<LencoCollection>;
    return mapCollectionStatus(body.data.status);
  }

  async refund(_providerRef: string, _amountMinor: number): Promise<void> {
    // Lenco exposes no reverse-a-collection call. A refund is a transfer back
    // to the payer, which needs their MSISDN — held on the order, not here.
    // Fail loudly rather than silently no-op on someone's money.
    throw new AppError(
      502,
      "REFUND_NOT_SUPPORTED",
      "Lenco has no collection reversal — refund via a transfer to the payer",
    );
  }
}

/**
 * HMAC-SHA512 over the raw body, keyed on the SHA-256 of the API token.
 * Shared with the disbursement client, which receives transfer.* events on the
 * same endpoint.
 */
export async function verifyLencoSignature(
  rawBody: string,
  signature: string | undefined,
  apiKey: string = env.LENCO_API_KEY,
): Promise<void> {
  if (!apiKey) {
    throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Lenco is not configured");
  }
  const { createHash, createHmac, timingSafeEqual } = await import("node:crypto");
  const key = createHash("sha256").update(apiKey).digest();
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");

  const provided = Buffer.from(signature ?? "", "utf8");
  const wanted = Buffer.from(expected, "utf8");
  if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
    throw new AppError(401, "BAD_SIGNATURE", "Lenco webhook signature verification failed");
  }
}
