import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type { DisbursementProvider, TransferInput } from "./disbursement";
import { toNationalMsisdn, type LencoOperator } from "./lenco";

/**
 * Lenco transfers — money OUT to a courier's wallet.
 *
 * Replaces MTN Disbursements, and unlike it reaches Airtel and Zamtel wallets
 * too, so a courier's network stops being a payout constraint.
 *
 * Docs: https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-mobile-money
 *
 * Two things differ from collections: transfers debit a specific account, so
 * LENCO_ACCOUNT_ID is required; and there is no per-request customer approval,
 * so a transfer can complete synchronously.
 */

/**
 * Which network to pay out on. Couriers register a phone but not a network, so
 * it is derived from the MSISDN prefix.
 *
 * ⚠️ Zambian prefix allocations are the one thing here not taken from Lenco's
 * docs — verify against current MNO allocations before going live, and note
 * that a ported number defeats prefix inference entirely. Lenco's
 * /resolve/mobile-money would confirm the operator authoritatively; wiring that
 * in is the robust fix once payouts are exercised against real numbers.
 */
export function operatorFromPhone(phone: string): LencoOperator | null {
  const national = toNationalMsisdn(phone);
  const prefix = national.slice(0, 3);
  if (["096", "076"].includes(prefix)) return "mtn";
  if (["097", "077"].includes(prefix)) return "airtel";
  if (["095", "075"].includes(prefix)) return "zamtel";
  return null;
}

type LencoTransfer = {
  id: string;
  reference: string;
  lencoReference: string | null;
  status: "pending" | "successful" | "failed";
  reasonForFailure: string | null;
};

/** Injectable for the same reason as LencoConfig — see lenco.ts. */
export type LencoTransferConfig = { baseUrl: string; apiKey: string; accountId: string };

export class LencoDisbursements implements DisbursementProvider {
  readonly name = "lenco";
  private readonly overrides?: Partial<LencoTransferConfig>;

  constructor(overrides?: Partial<LencoTransferConfig>) {
    this.overrides = overrides;
  }

  private get cfg(): LencoTransferConfig {
    return {
      baseUrl: this.overrides?.baseUrl ?? env.LENCO_API_BASE_URL,
      apiKey: this.overrides?.apiKey ?? env.LENCO_API_KEY,
      accountId: this.overrides?.accountId ?? env.LENCO_ACCOUNT_ID,
    };
  }

  get isConfigured(): boolean {
    return Boolean(this.cfg.apiKey && this.cfg.accountId);
  }

  async transfer(input: TransferInput): Promise<string> {
    if (!this.isConfigured) {
      throw new AppError(
        502,
        "DISBURSEMENTS_NOT_CONFIGURED",
        "Lenco payouts need LENCO_API_KEY and LENCO_ACCOUNT_ID",
      );
    }

    const operator = operatorFromPhone(input.payeePhone);
    if (!operator) {
      // Better to stop and let an operator settle by hand than to guess a
      // network and push someone's earnings at the wrong rail.
      throw new AppError(
        400,
        "UNKNOWN_MOBILE_OPERATOR",
        `Cannot determine the mobile network for ${input.payeePhone} — settle this payout manually`,
      );
    }

    // Caller-supplied reference makes a retry idempotent: Lenco rejects a
    // duplicate rather than sending the money twice.
    const reference = input.referenceId ?? crypto.randomUUID();

    const res = await fetch(`${this.cfg.baseUrl}/transfers/mobile-money`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId: this.cfg.accountId,
        amount: input.amountMinor / 100, // MAJOR units (kwacha)
        reference,
        phone: toNationalMsisdn(input.payeePhone),
        operator,
        country: "zm",
        narration: input.note,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.error("lenco.transfer.error", {
        status: res.status, reference, operator, detail: detail.slice(0, 300),
      });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Courier payout failed");
    }

    const body = (await res.json()) as { status: boolean; message: string; data: LencoTransfer };
    if (!body.status || !body.data) {
      logger.error("lenco.transfer.rejected", { reference, message: body.message });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Courier payout was rejected");
    }
    if (body.data.status === "failed") {
      logger.error("lenco.transfer.failed", {
        reference, reason: body.data.reasonForFailure,
      });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Courier payout was declined");
    }

    // `pending` is a normal outcome — transfer.successful / transfer.failed
    // arrives on the webhook. The ledger row is marked settled either way, so
    // a failure needs the operator to reopen it; the reference below is what
    // ties the two together.
    logger.info("lenco.transfer.accepted", {
      reference, lencoReference: body.data.lencoReference,
      status: body.data.status, amountMinor: input.amountMinor, operator,
    });
    return reference;
  }
}

export const lencoDisbursements = new LencoDisbursements();
