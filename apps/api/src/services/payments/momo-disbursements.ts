import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type { DisbursementProvider, TransferInput } from "./disbursement";

/**
 * MTN MoMo Disbursements — money OUT (the Collections product only pulls
 * money IN). Two uses here:
 *   1. Refunds for MoMo-collected payments (MtnMomoProvider.refund delegates)
 *   2. Courier payout settlement (platform admin pushes pending earnings)
 *
 * Separate product = separate subscription key + token scope, hence the
 * dedicated DISBURSEMENT_* env vars. Configured-ness is checked at call time
 * so deployments that settle payouts manually can leave it unwired.
 */
export class MomoDisbursements implements DisbursementProvider {
  readonly name = "mtn_momo";

  private token: { value: string; expiresAt: number } | null = null;

  get isConfigured(): boolean {
    return Boolean(
      env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY && env.MOMO_API_USER && env.MOMO_API_KEY,
    );
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      "Ocp-Apim-Subscription-Key": env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
      "X-Target-Environment": env.MOMO_TARGET_ENVIRONMENT,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    const basic = btoa(`${env.MOMO_API_USER}:${env.MOMO_API_KEY}`);
    const res = await fetch(`${env.MOMO_API_BASE_URL}/disbursement/token/`, {
      method: "POST",
      headers: this.headers({ Authorization: `Basic ${basic}` }),
    });
    if (!res.ok) {
      logger.error("momo.disbursement.token.error", { status: res.status });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "MoMo disbursement auth failed");
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return this.token.value;
  }

  /**
   * Push money to an MSISDN. Returns the reference UUID we minted — persist
   * it before calling so a crash between transfer and persist is auditable.
   */
  async transfer(input: TransferInput): Promise<string> {
    if (!this.isConfigured) {
      throw new AppError(
        502,
        "DISBURSEMENTS_NOT_CONFIGURED",
        "MoMo Disbursements credentials are not configured",
      );
    }
    const referenceId = input.referenceId ?? crypto.randomUUID();
    const token = await this.accessToken();

    const res = await fetch(`${env.MOMO_API_BASE_URL}/disbursement/v1_0/transfer`, {
      method: "POST",
      headers: this.headers({
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": referenceId,
      }),
      body: JSON.stringify({
        amount: (input.amountMinor / 100).toFixed(2), // major units
        currency: input.currency,
        externalId: referenceId,
        payee: { partyIdType: "MSISDN", partyId: input.payeePhone.replace(/^\+/, "") },
        payerMessage: input.note,
        payeeNote: input.note,
      }),
    });
    if (res.status !== 202) {
      logger.error("momo.transfer.error", { status: res.status, referenceId });
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "MoMo transfer failed");
    }
    logger.info("momo.transfer.accepted", { referenceId, amountMinor: input.amountMinor });
    return referenceId;
  }
}

export const momoDisbursements = new MomoDisbursements();
