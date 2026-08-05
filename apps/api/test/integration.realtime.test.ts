/**
 * Integration: auth hardening + realtime gateway, against real Postgres and a
 * real Bun.serve instance (the WS upgrade path can't be exercised through
 * app.request()).
 *
 * Skips itself when TEST_DATABASE_URL is not set.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ensureTestDb } from "./db-setup";

const TEST_DB = process.env.TEST_DATABASE_URL;
const enabled = Boolean(TEST_DB);
if (!enabled) {
  console.warn("[integration] TEST_DATABASE_URL not set — skipping realtime suite");
}

if (enabled) {
  process.env.JWT_SECRET ??= "integration-test-secret-0123456789abcdef";
  process.env.PAYMENT_PROVIDER = "mock";
  delete process.env.YANGO_API_KEY;
}

let server: { port: number | undefined; stop: (force?: boolean) => void };
let base: string;
let wsBase: string;
let db: (typeof import("../src/db"))["db"];
let schema: typeof import("../src/db/schema");
let pipeline: (typeof import("../src/services/instances"))["pipeline"];


type Json = Record<string, unknown>;

async function call(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<{ status: number; body: Json }> {
  const res = await fetch(`${base}${path}`, {
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

const run = crypto.randomUUID().slice(0, 8);

describe.if(enabled)("integration: auth hardening + realtime", () => {
  beforeAll(async () => {
    await ensureTestDb(TEST_DB!); // shared, memoized: sets DATABASE_URL + migrates once

    ({ db } = await import("../src/db"));
    schema = await import("../src/db/schema");
    ({ pipeline } = await import("../src/services/instances"));
    const { buildApp } = await import("../src/app");
    const { websocket } = await import("../src/routes/ws");

    // Real server on a random free port — required for the WS upgrade path
    server = Bun.serve({ port: 0, fetch: buildApp().fetch, websocket });
    base = `http://localhost:${server.port}`;
    wsBase = `ws://localhost:${server.port}`;
  });

  afterAll(() => {
    server?.stop(true);
    // Pool/database are shared across suites — no DB teardown here.
  });

  // -------------------------------------------------------------------------
  // Refresh tokens
  // -------------------------------------------------------------------------
  test("refresh rotation: old token is single-use; reuse revokes the family", async () => {
    const reg = await call("POST", "/auth/register", {
      body: {
        email: `rt+${run}@campuscart.test`, password: "password-1",
        fullName: "Re Fresh", phone: "+260974444444", role: "shopper",
      },
    });
    expect(reg.status).toBe(201);
    const { token, refreshToken } = reg.body as { token: string; refreshToken: string };
    expect(refreshToken.length).toBeGreaterThan(20);

    // Exchange: get a fresh pair
    const r1 = await call("POST", "/auth/refresh", { body: { refreshToken } });
    expect(r1.status).toBe(200);
    const rotated = r1.body as { token: string; refreshToken: string };
    expect(rotated.refreshToken).not.toBe(refreshToken);

    // New access token actually works
    const orders = await call("GET", "/orders", { token: rotated.token });
    expect(orders.status).toBe(200);

    // Replaying the ORIGINAL token = theft signal → 401
    const replay = await call("POST", "/auth/refresh", { body: { refreshToken } });
    expect(replay.status).toBe(401);

    // …and the whole family is revoked, including the rotated one
    const afterTheft = await call("POST", "/auth/refresh", {
      body: { refreshToken: rotated.refreshToken },
    });
    expect(afterTheft.status).toBe(401);

    // Old access JWTs keep working until natural expiry (stateless by design)
    expect((await call("GET", "/orders", { token })).status).toBe(200);
  });

  test("logout revokes the refresh token", async () => {
    const reg = await call("POST", "/auth/register", {
      body: {
        email: `lo+${run}@campuscart.test`, password: "password-1",
        fullName: "Log Out", phone: "+260975555555", role: "shopper",
      },
    });
    const { refreshToken } = reg.body as { refreshToken: string };

    expect((await call("POST", "/auth/logout", { body: { refreshToken } })).status).toBe(200);
    expect((await call("POST", "/auth/refresh", { body: { refreshToken } })).status).toBe(401);
  });

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------
  test("login attempts are rate limited per account", async () => {
    const email = `bruteforce+${run}@campuscart.test`;
    let limited = false;
    let retryAfter: string | null = null;

    for (let i = 0; i < 12; i += 1) {
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: `wrong-${i}` }),
      });
      if (res.status === 429) {
        limited = true;
        retryAfter = res.headers.get("Retry-After");
        const body = (await res.json()) as { error: { code: string } };
        expect(body.error.code).toBe("RATE_LIMITED");
        break;
      }
      expect(res.status).toBe(401); // wrong password until the limiter trips
    }
    expect(limited).toBe(true);
    expect(Number(retryAfter)).toBeGreaterThan(0);

    // A different account is unaffected (per-key isolation)
    const other = await call("POST", "/auth/login", {
      body: { email: `other+${run}@campuscart.test`, password: "x".repeat(8) },
    });
    expect(other.status).toBe(401);
  });

  // -------------------------------------------------------------------------
  // WebSocket realtime gateway
  // -------------------------------------------------------------------------
  test("shopper subscribes to their order and receives live status frames", async () => {
    // Minimal world: shop + product seeded directly, shopper via the API
    const [shop] = await db.insert(schema.shops).values({
      name: `WS Shop ${run}`, slug: `ws-shop-${run}`,
      pickupLat: -12.808, pickupLng: 28.238,
    }).returning();
    const [product] = await db.insert(schema.products).values({
      shopId: shop!.id, name: "Fritters", category: "food",
      priceMinor: 1_000, currency: "ZMW", stockQty: 5,
    }).returning();

    const reg = await call("POST", "/auth/register", {
      body: {
        email: `ws+${run}@campuscart.test`, password: "password-1",
        fullName: "Web Socket", phone: "+260976666666", role: "shopper",
      },
    });
    const { token } = reg.body as { token: string };

    const add = await call("POST", "/cart/items", { token, body: { productId: product!.id, qty: 1 } });
    const cartId = (add.body as { id: string }).id;
    const checkout = await call("POST", "/checkout", {
      token,
      headers: { "Idempotency-Key": `ws-${run}-checkout` },
      body: {
        cartId, fulfillmentType: "delivery",
        dropoff: { lat: -12.81, lng: 28.24 }, dropoffAddress: "Hostel 3",
        paymentMethod: "mtn_momo", payerPhone: "+260961234567",
      },
    });
    expect(checkout.status).toBe(201);
    const orderId = (checkout.body as { order: { id: string } }).order.id;

    // Connect, subscribe, then drive a transition and expect the frame
    const frames: Json[] = [];
    const ws = new WebSocket(`${wsBase}/ws?token=${token}`);
    const opened = new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("ws failed to open"));
    });
    ws.onmessage = (evt) => frames.push(JSON.parse(String(evt.data)) as Json);
    await opened;

    ws.send(JSON.stringify({ type: "subscribe", orderId }));
    await waitFor(() => frames.some((f) => f.type === "subscribed"));

    await pipeline.transition({ orderId, to: "preparing", actor: "shop_admin" });
    await waitFor(() => frames.some((f) => f.type === "order.status" && f.status === "preparing"));

    const statusFrame = frames.find((f) => f.type === "order.status");
    expect(statusFrame?.orderId).toBe(orderId);

    ws.close();
  });

  test("gateway rejects bad tokens and foreign-order subscriptions", async () => {
    // Bad token → server closes the socket
    const badWs = new WebSocket(`${wsBase}/ws?token=not-a-jwt`);
    const closed = await new Promise<boolean>((resolve) => {
      badWs.onclose = () => resolve(true);
      badWs.onerror = () => {};
      setTimeout(() => resolve(false), 3_000);
    });
    expect(closed).toBe(true);

    // Authenticated stranger subscribing to someone else's order → FORBIDDEN
    const reg = await call("POST", "/auth/register", {
      body: {
        email: `stranger+${run}@campuscart.test`, password: "password-1",
        fullName: "Str Anger", phone: "+260977777777", role: "shopper",
      },
    });
    const { token } = reg.body as { token: string };
    const [anyOrder] = await db.select().from(schema.orders).limit(1);

    const frames: Json[] = [];
    const ws = new WebSocket(`${wsBase}/ws?token=${token}`);
    await new Promise<void>((resolve) => { ws.onopen = () => resolve(); });
    ws.onmessage = (evt) => frames.push(JSON.parse(String(evt.data)) as Json);
    ws.send(JSON.stringify({ type: "subscribe", orderId: anyOrder!.id }));
    await waitFor(() => frames.some((f) => f.type === "error"));
    expect(frames.find((f) => f.type === "error")?.code).toBe("FORBIDDEN");
    ws.close();
  });
});

async function waitFor(predicate: () => boolean, timeoutMs = 5_000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((r) => setTimeout(r, 25));
  }
}
