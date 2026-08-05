import type {
  DeliveryEstimate, DeliveryProvider, DeliveryRequestInput, DeliveryTracking,
} from "./provider";

/** In-memory provider for tests and local dev — deterministic and Yango-free. */
export class MockDeliveryProvider implements DeliveryProvider {
  readonly name = "mock";
  private seq = 0;
  readonly requests = new Map<string, DeliveryTracking>();

  async estimate(_input: DeliveryRequestInput): Promise<DeliveryEstimate> {
    return { feeMinor: 1500, currency: "ZMW", etaMinutes: 20 }; // flat K15
  }

  async createRequest(input: DeliveryRequestInput): Promise<{ requestId: string }> {
    const requestId = `mock-${++this.seq}-${input.externalOrderId.slice(0, 8)}`;
    this.requests.set(requestId, { requestId, status: "created", courierLocation: null });
    return { requestId };
  }

  async track(requestId: string): Promise<DeliveryTracking> {
    const t = this.requests.get(requestId);
    if (!t) throw new Error(`unknown mock request ${requestId}`);
    return t;
  }

  async cancel(requestId: string): Promise<void> {
    const t = this.requests.get(requestId);
    if (t) t.status = "cancelled";
  }

  /** Test helper to simulate provider-side progress. */
  advance(requestId: string, status: DeliveryTracking["status"]): void {
    const t = this.requests.get(requestId);
    if (t) t.status = status;
  }
}
