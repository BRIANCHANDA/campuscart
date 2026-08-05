import type { InitiatedPayment, InitiatePaymentInput, PaymentProvider } from "./provider";

/** Instantly-succeeding provider for dev/tests. */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock" as const;
  private seq = 0;

  async initiate(input: InitiatePaymentInput): Promise<InitiatedPayment> {
    return {
      providerRef: `mockpay-${++this.seq}-${input.orderId.slice(0, 8)}`,
      clientSecret: null,
      status: "succeeded",
    };
  }

  async parseWebhook(rawBody: string): Promise<{ providerRef: string; status: "succeeded" | "failed" | "refunded" }> {
    const b = JSON.parse(rawBody) as { providerRef: string; status: "succeeded" | "failed" | "refunded" };
    return b;
  }

  async refund(): Promise<void> {}
}
