/**
 * Integration test: the full happy path over real HTTP handlers + a real Postgres.
 *
 *   register users → create shop → stock product → verify courier
 *   → cart → idempotent checkout → preparing → dispatch (Yango mock)
 *   → pickup → delivered
 *
 * Run with:
 *   TEST_DATABASE_URL=postgres://campuscart:campuscart@127.0.0.1:5432/campuscart_test bun test integration
 *
 * Skips itself (with a notice) when TEST_DATABASE_URL is not set, so `bun test`
 * stays green on machines without Postgres.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ensureTestDb } from "./db-setup";

const TEST_DB = process.env.TEST_DATABASE_URL;
const enabled = Boolean(TEST_DB);
if (!enabled) {
  console.warn("[integration] TEST_DATABASE_URL not set — skipping integration suite");
}

// Environment must be in place BEFORE any src module is imported (env.ts parses eagerly).
if (enabled) {
  process.env.JWT_SECRET ??= "integration-test-secret-0123456789abcdef";
  process.env.PAYMENT_PROVIDER = "mock";
  delete process.env.YANGO_API_KEY; // force MockDeliveryProvider
}

// Lazily-bound handles (populated in beforeAll so imports respect the env above)
let app: { request: (path: string, init?: RequestInit) => Response | Promise<Response> };
let db: (typeof import("../src/db"))["db"];
let schema: typeof import("../src/db/schema");


type Json = Record<string, unknown>;

async function call(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<{ status: number; body: Json }> {
  const res = await app.request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...opts.headers,
    },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });
  return { status: res.status, body: (await res.json()) as Json };
}

describe.if(enabled)("integration: checkout → dispatch → delivered", () => {
  // Actors
  let adminToken: string;
  let shopperToken: string;
  let shopperId: string;
  let courierToken: string;
  let courierUserId: string;
  let courierId: string;
  let shopAdminToken: string;
  let shopAdminUserId: string;

  // Domain objects threaded through the flow
  let shopId: string;
  let productId: string;
  let cartId: string;
  let orderId: string;

  const DROPOFF = { lat: -12.808, lng: 28.238 }; // CBU campus, Kitwe
  const PICKUP = { lat: -12.802, lng: 28.213 };  // Monk Square, ~2.7km away
  const run = crypto.randomUUID().slice(0, 8); // unique emails per run

  beforeAll(async () => {
    await ensureTestDb(TEST_DB!); // shared, memoized: sets DATABASE_URL + migrates once

    ({ db } = await import("../src/db"));
    schema = await import("../src/db/schema");
    const { buildApp } = await import("../src/app");
    app = buildApp();

    // Leftover couriers from previous runs would compete in proximity
    // assignment — bench them all; this suite verifies its own.
    await db.update(schema.couriers).set({ isAvailable: false });

    // Platform admins are onboarded, never self-registered — seed one directly.
    const passwordHash = await Bun.password.hash("admin-pass-123");
    await db.insert(schema.users).values({
      email: `admin+${run}@campuscart.test`,
      passwordHash,
      fullName: "Platform Admin",
      phone: "+260970000000",
      role: "platform_admin",
    });
    const login = await call("POST", "/auth/login", {
      body: { email: `admin+${run}@campuscart.test`, password: "admin-pass-123" },
    });
    expect(login.status).toBe(200);
    adminToken = (login.body as { token: string }).token;
  });

  // No teardown: pool and database are shared across every suite in the process.

  test("actors onboard: shopper, courier (auto-profile), shop + shop admin", async () => {
    // Shopper self-registers
    const shopper = await call("POST", "/auth/register", {
      body: {
        email: `shopper+${run}@campuscart.test`, password: "shopper-pass",
        fullName: "Sh Opper", phone: "+260971111111", role: "shopper",
      },
    });
    expect(shopper.status).toBe(201);
    shopperToken = (shopper.body as { token: string }).token;
    shopperId = (shopper.body as { user: { id: string } }).user.id;

    // Courier self-registers → courier profile row auto-created, pending verification
    const courier = await call("POST", "/auth/register", {
      body: {
        email: `courier+${run}@campuscart.test`, password: "courier-pass",
        fullName: "Co Urier", phone: "+260972222222", role: "courier",
      },
    });
    expect(courier.status).toBe(201);
    courierToken = (courier.body as { token: string }).token;
    courierUserId = (courier.body as { user: { id: string } }).user.id;

    // A plain user who will be promoted to shop_admin when the shop is created
    const owner = await call("POST", "/auth/register", {
      body: {
        email: `owner+${run}@campuscart.test`, password: "owner-pass-1",
        fullName: "Shop Owner", phone: "+260973333333", role: "shopper",
      },
    });
    expect(owner.status).toBe(201);
    shopAdminUserId = (owner.body as { user: { id: string } }).user.id;

    // Platform admin creates the shop and promotes the owner in one call
    // A shop with no pickup point can't be quoted or assigned a courier.
    const noLocation = await call("POST", "/platform/shops", {
      token: adminToken,
      body: { name: `No Location ${run}`, description: "Missing pickup point" },
    });
    expect(noLocation.status).toBe(400);

    // (0,0) is a valid lat/lng but is what an unset field looks like.
    const nullIsland = await call("POST", "/platform/shops", {
      token: adminToken,
      body: { name: `Null Island ${run}`, description: "Zeroed", location: { lat: 0, lng: 0 } },
    });
    expect(nullIsland.status).toBe(400);

    const shop = await call("POST", "/platform/shops", {
      token: adminToken,
      body: {
        name: `Monk Square Mini Mart ${run}`, description: "Campus tuck shop",
        adminUserId: shopAdminUserId, location: PICKUP,
      },
    });
    expect(shop.status).toBe(201);
    shopId = (shop.body as { id: string }).id;

    // Re-login so the JWT carries the new role + shopIds claim
    const ownerLogin = await call("POST", "/auth/login", {
      body: { email: `owner+${run}@campuscart.test`, password: "owner-pass-1" },
    });
    expect(ownerLogin.status).toBe(200);
    expect((ownerLogin.body as { user: { role: string } }).user.role).toBe("shop_admin");
    shopAdminToken = (ownerLogin.body as { token: string }).token;

    // The app resolves its tenant via GET /admin/shops
    const myShops = await call("GET", "/admin/shops", { token: shopAdminToken });
    expect(myShops.status).toBe(200);
    expect((myShops.body as unknown as Array<{ id: string }>).some((s) => s.id === shopId)).toBe(true);
  });

  test("tenant isolation: shop admin cannot touch a shop they don't own", async () => {
    const res = await call("POST", `/admin/shops/${crypto.randomUUID()}/products`, {
      token: shopAdminToken,
      body: { name: "x", description: null, category: "food", priceMinor: 100, currency: "ZMW", stockQty: 1, imageUrl: null },
    });
    expect(res.status).toBe(403);
  });

  test("shop admin stocks a product; it appears in the public feed", async () => {
    const created = await call("POST", `/admin/shops/${shopId}/products`, {
      token: shopAdminToken,
      body: {
        name: "Chicken & Chips", description: "Quarter chicken with chips",
        category: "food", priceMinor: 5_500, currency: "ZMW", stockQty: 10, imageUrl: null,
      },
    });
    expect(created.status).toBe(201);
    productId = (created.body as { id: string }).id;

    const feed = await call("GET", `/products?q=chicken&shopId=${shopId}`);
    expect(feed.status).toBe(200);
    const data = (feed.body as { data: Array<{ id: string }> }).data;
    expect(data.some((p) => p.id === productId)).toBe(true);
  });

  test("courier is verified by platform admin and goes online", async () => {
    // Going online before verification is rejected
    const early = await call("PATCH", "/courier/availability", {
      token: courierToken, body: { isAvailable: true },
    });
    expect(early.status).toBe(400);

    const { eq } = await import("drizzle-orm");
    const [profile] = await db
      .select().from(schema.couriers)
      .where(eq(schema.couriers.userId, courierUserId)).limit(1);
    expect(profile).toBeDefined();
    courierId = profile!.id;

    const verified = await call("PATCH", `/platform/couriers/${courierId}/verification`, {
      token: adminToken, body: { status: "verified" },
    });
    expect(verified.status).toBe(200);

    const online = await call("PATCH", "/courier/availability", {
      token: courierToken, body: { isAvailable: true },
    });
    expect(online.status).toBe(200);
  });

  test("shopper builds a cart and checks out idempotently", async () => {
    const add = await call("POST", "/cart/items", {
      token: shopperToken, body: { productId, qty: 2 },
    });
    expect(add.status).toBe(200);
    const cart = add.body as { id: string; subtotalMinor: number };
    cartId = cart.id;
    expect(cart.subtotalMinor).toBe(11_000);

    // A fresh app launch holds no cart id — /cart/active restores it.
    const active = await call("GET", "/cart/active", { token: shopperToken });
    expect(active.status).toBe(200);
    expect((active.body as { id: string; subtotalMinor: number }).id).toBe(cartId);
    expect((active.body as { subtotalMinor: number }).subtotalMinor).toBe(11_000);

    const key = `it-${run}-checkout`;
    const payload = {
      cartId, fulfillmentType: "delivery" as const,
      dropoff: DROPOFF, dropoffAddress: "CBU Hostel 5, Riverside, Kitwe",
      paymentMethod: "airtel_money" as const, payerPhone: "+260971234567",
    };

    const first = await call("POST", "/checkout", {
      token: shopperToken, headers: { "Idempotency-Key": key }, body: payload,
    });
    expect(first.status).toBe(201);
    const firstBody = first.body as {
      order: { id: string; status: string; totalMinor: number; deliveryFeeMinor: number };
      payment: { status: string };
      replayed: boolean;
    };
    expect(firstBody.replayed).toBe(false);
    expect(firstBody.order.status).toBe("placed");
    expect(firstBody.payment.status).toBe("succeeded"); // mock provider settles instantly
    expect(firstBody.order.totalMinor).toBe(11_000 + firstBody.order.deliveryFeeMinor);
    orderId = firstBody.order.id;

    // Same key → replay, same order, no double charge
    const second = await call("POST", "/checkout", {
      token: shopperToken, headers: { "Idempotency-Key": key }, body: payload,
    });
    expect(second.status).toBe(201);
    const secondBody = second.body as { order: { id: string }; replayed: boolean };
    expect(secondBody.replayed).toBe(true);
    expect(secondBody.order.id).toBe(orderId);

    // Stock decremented exactly once
    const { eq } = await import("drizzle-orm");
    const [product] = await db
      .select().from(schema.products)
      .where(eq(schema.products.id, productId)).limit(1);
    expect(product!.stockQty).toBe(8);

    // Ledger already carries the shop/platform split (8% fee)
    const ledger = await db
      .select().from(schema.payoutLedger)
      .where(eq(schema.payoutLedger.orderId, orderId));
    const byType = Object.fromEntries(ledger.map((l) => [l.entryType, l.amountMinor]));
    expect(byType["platform_fee"]).toBe(880);
    expect(byType["shop_sale"]).toBe(10_120);

    // Checked-out carts are no longer active — a relaunch must not resurrect one.
    const afterCheckout = await call("GET", "/cart/active", { token: shopperToken });
    expect(afterCheckout.status).toBe(200);
    expect(afterCheckout.body).toBeNull();
  });

  test("shop prepares, dispatches via Yango provider; courier + request id are linked", async () => {
    // Skipping straight to out_for_delivery is illegal for the shop
    const skip = await call("PATCH", `/admin/shops/${shopId}/orders/${orderId}/status`, {
      token: shopAdminToken, body: { status: "out_for_delivery" },
    });
    expect(skip.status).toBe(409);

    const prep = await call("PATCH", `/admin/shops/${shopId}/orders/${orderId}/status`, {
      token: shopAdminToken, body: { status: "preparing" },
    });
    expect(prep.status).toBe(200);

    const dispatch = await call("POST", `/admin/shops/${shopId}/orders/${orderId}/dispatch`, {
      token: shopAdminToken,
    });
    expect(dispatch.status).toBe(200);
    const d = dispatch.body as { yangoRequestId: string; courierId: string };
    expect(d.yangoRequestId).toBeTruthy();
    expect(d.courierId).toBe(courierId);

    // deliveries row carries BOTH the Yango request id and our courier id
    const { eq } = await import("drizzle-orm");
    const [delivery] = await db
      .select().from(schema.deliveries)
      .where(eq(schema.deliveries.orderId, orderId)).limit(1);
    expect(delivery!.yangoRequestId).toBe(d.yangoRequestId);
    expect(delivery!.courierId).toBe(courierId);
    expect(delivery!.status).toBe("dispatched");

    // Order advanced by the pipeline (system actor), courier payout ledgered
    const order = await call("GET", `/orders/${orderId}`, { token: shopperToken });
    expect((order.body as { status: string }).status).toBe("out_for_delivery");

    const ledger = await db
      .select().from(schema.payoutLedger)
      .where(eq(schema.payoutLedger.orderId, orderId));
    expect(ledger.some((l) => l.entryType === "courier_payout" && l.courierId === courierId)).toBe(true);
  });

  test("courier picks up, pushes location, completes; shopper sees it all in tracking", async () => {
    const { eq } = await import("drizzle-orm");
    const [delivery] = await db
      .select().from(schema.deliveries)
      .where(eq(schema.deliveries.orderId, orderId)).limit(1);
    const deliveryId = delivery!.id;

    expect((await call("POST", `/courier/deliveries/${deliveryId}/pickup`, { token: courierToken })).status).toBe(200);

    const loc = await call("POST", `/courier/deliveries/${deliveryId}/location`, {
      token: courierToken, body: { lat: -12.81, lng: 28.24 },
    });
    expect(loc.status).toBe(200);

    const tracking = await call("GET", `/orders/${orderId}/tracking`, { token: shopperToken });
    expect(tracking.status).toBe(200);
    const t = tracking.body as { delivery: { status: string; courierLocation: { lat: number } | null } };
    expect(t.delivery.status).toBe("picked_up");
    expect(t.delivery.courierLocation?.lat).toBeCloseTo(-12.81);

    expect((await call("POST", `/courier/deliveries/${deliveryId}/complete`, { token: courierToken })).status).toBe(200);

    const final = await call("GET", `/orders/${orderId}`, { token: shopperToken });
    expect((final.body as { status: string }).status).toBe("delivered");

    // Terminal: nothing moves a delivered order
    const poke = await call("PATCH", `/admin/shops/${shopId}/orders/${orderId}/status`, {
      token: shopAdminToken, body: { status: "cancelled" },
    });
    expect(poke.status).toBe(409);

    // Courier sees the payout
    const payouts = await call("GET", "/courier/payouts", { token: courierToken });
    expect(payouts.status).toBe(200);
    const p = payouts.body as { pendingMinor: number; settledMinor: number };
    expect(p.pendingMinor + p.settledMinor).toBeGreaterThan(0);
  });

  test("platform admin settles the courier's pending payouts exactly once", async () => {
    // Pending payouts are visible, grouped by courier
    const pending = await call("GET", "/platform/payouts/pending", { token: adminToken });
    expect(pending.status).toBe(200);
    const mine = (pending.body as unknown as Array<{ courierId: string; pendingMinor: number }>)
      .find((p) => p.courierId === courierId);
    expect(mine).toBeDefined();
    expect(mine!.pendingMinor).toBeGreaterThan(0);

    // Settle: no Disbursements creds in tests → recorded as a manual payout
    const settle = await call("POST", "/platform/payouts/settle", {
      token: adminToken, body: { courierId },
    });
    expect(settle.status).toBe(200);
    const result = settle.body as { settledMinor: number; settlementRef: string; transferred: boolean };
    expect(result.settledMinor).toBe(mine!.pendingMinor);
    expect(result.settlementRef).toBe("manual");
    expect(result.transferred).toBe(false);

    // The courier's app now shows it as settled, not pending
    const payouts = await call("GET", "/courier/payouts", { token: courierToken });
    const p = payouts.body as { pendingMinor: number; settledMinor: number };
    expect(p.pendingMinor).toBe(0);
    expect(p.settledMinor).toBe(result.settledMinor);

    // Settlement is not repeatable — status=pending guards double-pay
    const again = await call("POST", "/platform/payouts/settle", {
      token: adminToken, body: { courierId },
    });
    expect(again.status).toBe(400);
    expect((again.body as { error: { code: string } }).error.code).toBe("NOTHING_PENDING");
  });

  test("Yango webhook is idempotent and tolerant of unknown claims", async () => {
    const { eq } = await import("drizzle-orm");
    const [delivery] = await db
      .select().from(schema.deliveries)
      .where(eq(schema.deliveries.orderId, orderId)).limit(1);

    // Replay of "delivered" AFTER the courier already completed in-app:
    // must ack, must not throw, must not corrupt state
    const replay = await call("POST", "/webhooks/yango", {
      body: { claim_id: delivery!.yangoRequestId, status: "delivered_finish" },
    });
    expect(replay.status).toBe(200);

    const order = await call("GET", `/orders/${orderId}`, { token: shopperToken });
    expect((order.body as { status: string }).status).toBe("delivered");

    // Unknown claim id: acknowledged so Yango stops retrying, flagged unmatched
    const unknown = await call("POST", "/webhooks/yango", {
      body: { claim_id: "claim-that-does-not-exist", status: "delivered" },
    });
    expect(unknown.status).toBe(200);
    expect((unknown.body as { matched: boolean }).matched).toBe(false);

    // Garbage payload: 400 in the shared error shape
    const garbage = await call("POST", "/webhooks/yango", { body: { nope: true } });
    expect(garbage.status).toBe(400);
  });
});
