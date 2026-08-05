/**
 * Payment abstraction. Stripe, MTN MoMo, and Airtel Money implement it
 * (plus a mock for tests/local dev). The mobile-money providers follow the
 * same "request-to-pay" shape: initiate → customer approves on their phone
 * → provider callback settles the payment.
 */
export interface InitiatePaymentInput {
  orderId: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  /** Payer MSISDN, e.g. "+260971234567" — required by MoMo/Airtel request-to-pay. */
  customerPhone: string;
}

export interface InitiatedPayment {
  providerRef: string;          // provider's payment/intent id
  clientSecret: string | null;  // handed to the mobile app to complete payment
  status: "pending" | "succeeded";
}

export interface PaymentProvider {
  readonly name: "mock" | "stripe" | "paypal" | "mtn_momo" | "airtel_money";
  initiate(input: InitiatePaymentInput): Promise<InitiatedPayment>;
  /** Verify + parse an incoming webhook. Throws on bad signature. */
  parseWebhook(rawBody: string, signature: string | undefined): Promise<{
    providerRef: string;
    status: "succeeded" | "failed" | "refunded";
  }>;
  refund(providerRef: string, amountMinor: number): Promise<void>;
}
