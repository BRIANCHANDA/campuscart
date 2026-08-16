/**
 * Payout abstraction — money OUT.
 *
 * Collections (money in) already go through `PaymentProvider`; this is its
 * counterpart, and exists for the same reason: the settle route and the refund
 * path should not know which rail moves the money.
 *
 * Implementations: MTN MoMo Disbursements, and (once its API details are
 * confirmed) Lenco. A deployment with no payout rail configured is a valid
 * state — the platform records settlements as `manual` and an operator pays
 * out by hand, which is how a pilot runs before provider onboarding completes.
 */
export interface TransferInput {
  amountMinor: number;
  currency: string;
  /** Payee MSISDN in international form, e.g. "+260971234567". */
  payeePhone: string;
  note: string;
  /**
   * Idempotency: pass an existing reference to retry the SAME transfer rather
   * than issue a second one. Persist it before calling.
   */
  referenceId?: string;
}

export interface DisbursementProvider {
  readonly name: string;
  /** False when credentials are absent — callers fall back to manual settlement. */
  readonly isConfigured: boolean;
  /** Pushes money to a wallet. Returns the provider reference for auditing. */
  transfer(input: TransferInput): Promise<string>;
}

/**
 * Stands in when no payout rail is configured. It never claims to have moved
 * money: `isConfigured` is false, so callers record a manual settlement, and
 * transfer() throws loudly if something calls it anyway rather than silently
 * reporting success for a payment that never happened.
 */
export class NoopDisbursements implements DisbursementProvider {
  readonly name = "none";
  readonly isConfigured = false;
  async transfer(): Promise<string> {
    const { AppError } = await import("../../lib/errors");
    throw new AppError(
      502,
      "DISBURSEMENTS_NOT_CONFIGURED",
      "No payout provider is configured — settle this payout manually",
    );
  }
}
