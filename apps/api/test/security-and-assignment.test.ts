import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";

// These modules transitively import env.ts (eager Zod parse) and the DB pool,
// so provide harmless env before loading them.
process.env.DATABASE_URL ??=
  process.env.TEST_DATABASE_URL ?? "postgres://unit:unit@localhost:5432/unit";
process.env.JWT_SECRET ??= "unit-test-secret-0123456789abcdef!!";
const { verifyStripeSignature } = await import("../src/services/payments/stripe");
const { haversineMeters, rankCouriers } = await import("../src/services/couriers/assignment");

// ---------------------------------------------------------------------------
// Stripe webhook signatures
// ---------------------------------------------------------------------------
const SECRET = "whsec_test_secret";
const sign = (payload: string, t: number, secret = SECRET): string =>
  createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");

describe("verifyStripeSignature", () => {
  const payload = JSON.stringify({ type: "payment_intent.succeeded", data: { object: { id: "pi_1" } } });
  const now = 1_700_000_000;

  test("accepts a valid, fresh signature", () => {
    const t = now - 10;
    const header = `t=${t},v1=${sign(payload, t)}`;
    expect(verifyStripeSignature(payload, header, SECRET, now)).toBe(true);
  });

  test("accepts when any v1 candidate matches (secret rotation)", () => {
    const t = now - 10;
    const header = `t=${t},v1=${"0".repeat(64)},v1=${sign(payload, t)}`;
    expect(verifyStripeSignature(payload, header, SECRET, now)).toBe(true);
  });

  test("rejects a tampered payload", () => {
    const t = now - 10;
    const header = `t=${t},v1=${sign(payload, t)}`;
    const tampered = payload.replace("pi_1", "pi_ATTACKER");
    expect(verifyStripeSignature(tampered, header, SECRET, now)).toBe(false);
  });

  test("rejects the wrong secret", () => {
    const t = now - 10;
    const header = `t=${t},v1=${sign(payload, t, "whsec_other")}`;
    expect(verifyStripeSignature(payload, header, SECRET, now)).toBe(false);
  });

  test("rejects stale timestamps (replay protection)", () => {
    const t = now - 3600; // an hour old
    const header = `t=${t},v1=${sign(payload, t)}`;
    expect(verifyStripeSignature(payload, header, SECRET, now)).toBe(false);
  });

  test("rejects malformed headers without throwing", () => {
    expect(verifyStripeSignature(payload, "", SECRET, now)).toBe(false);
    expect(verifyStripeSignature(payload, "t=abc,v1=nothex!", SECRET, now)).toBe(false);
    expect(verifyStripeSignature(payload, "v1=deadbeef", SECRET, now)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Proximity-based courier assignment
// ---------------------------------------------------------------------------
describe("haversineMeters", () => {
  test("zero for identical points", () => {
    const p = { lat: -12.808, lng: 28.238 };
    expect(haversineMeters(p, p)).toBe(0);
  });

  test("known distance: CBU Kitwe → Levy Mwanawasa Stadium Ndola ≈ 50km", () => {
    const cbu = { lat: -12.808, lng: 28.238 };
    const ndola = { lat: -12.9587, lng: 28.6366 };
    const d = haversineMeters(cbu, ndola);
    expect(d).toBeGreaterThan(40_000);
    expect(d).toBeLessThan(60_000);
  });
});

describe("rankCouriers", () => {
  const now = Date.now();
  const pickup = { lat: -12.808, lng: 28.238 }; // shop at CBU

  const courier = (id: string, over: Partial<Parameters<typeof rankCouriers>[0][number]> = {}) =>
    ({
      id,
      userId: `u-${id}`,
      verificationStatus: "verified",
      vehicleType: "bicycle",
      nrcNumber: null,
      isAvailable: true,
      lastLat: null,
      lastLng: null,
      lastSeenAt: null,
      createdAt: new Date(now - 1_000_000),
      ...over,
    }) as Parameters<typeof rankCouriers>[0][number];

  test("nearest fresh courier wins", () => {
    const near = courier("near", { lastLat: -12.809, lastLng: 28.239, lastSeenAt: new Date(now - 60_000) });
    const far = courier("far", { lastLat: -12.96, lastLng: 28.64, lastSeenAt: new Date(now - 60_000) });
    expect(rankCouriers([far, near], pickup, now)[0]?.id).toBe("near");
  });

  test("stale locations rank behind fresh ones", () => {
    const staleButClose = courier("stale", {
      lastLat: -12.808, lastLng: 28.238, lastSeenAt: new Date(now - 60 * 60_000), // 1h old
    });
    const freshButFar = courier("fresh", {
      lastLat: -12.96, lastLng: 28.64, lastSeenAt: new Date(now - 60_000),
    });
    expect(rankCouriers([staleButClose, freshButFar], pickup, now)[0]?.id).toBe("fresh");
  });

  test("degrades to any-available when nobody has reported a position", () => {
    const a = courier("a");
    const b = courier("b");
    const ranked = rankCouriers([a, b], pickup, now);
    expect(ranked).toHaveLength(2); // nobody excluded, order stable-ish
  });
});
