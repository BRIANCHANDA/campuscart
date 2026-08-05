import { describe, expect, test } from "bun:test";
import { MockDeliveryProvider } from "../src/services/delivery/mock";
import { MockPaymentProvider } from "../src/services/payments/mock";

const route = {
  externalOrderId: "11111111-2222-3333-4444-555555555555",
  pickup: { lat: -12.808, lng: 28.238 },   // CBU, Kitwe
  pickupAddress: "CBU Main Campus Cafe",
  dropoff: { lat: -12.812, lng: 28.245 },
  dropoffAddress: "Hostel Block D",
};

describe("DeliveryProvider contract (mock)", () => {
  test("estimate → create → track → advance → cancel", async () => {
    const p = new MockDeliveryProvider();
    const est = await p.estimate(route);
    expect(est.feeMinor).toBeGreaterThan(0);

    const { requestId } = await p.createRequest(route);
    expect((await p.track(requestId)).status).toBe("created");

    p.advance(requestId, "picked_up");
    expect((await p.track(requestId)).status).toBe("picked_up");

    await p.cancel(requestId);
    expect((await p.track(requestId)).status).toBe("cancelled");
  });
});

describe("PaymentProvider contract (mock)", () => {
  test("initiate + webhook parse", async () => {
    const p = new MockPaymentProvider();
    const init = await p.initiate({
      orderId: route.externalOrderId, amountMinor: 5000, currency: "ZMW", customerEmail: "s@cbu.ac.zm", customerPhone: "+260971234567",
    });
    expect(init.status).toBe("succeeded");

    const hook = await p.parseWebhook(JSON.stringify({ providerRef: init.providerRef, status: "refunded" }));
    expect(hook).toEqual({ providerRef: init.providerRef, status: "refunded" });
  });
});
