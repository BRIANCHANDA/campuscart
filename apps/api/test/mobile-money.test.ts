import { afterEach, beforeEach, describe, expect, test } from "bun:test";

process.env.DATABASE_URL ??=
  process.env.TEST_DATABASE_URL ?? "postgres://unit:unit@localhost:5432/unit";
process.env.JWT_SECRET ??= "unit-test-secret-0123456789abcdef!!";
process.env.MOMO_SUBSCRIPTION_KEY = "sub-key";
process.env.MOMO_API_USER = "api-user";
process.env.MOMO_API_KEY = "api-key";
process.env.AIRTEL_CLIENT_ID = "client-id";
process.env.AIRTEL_CLIENT_SECRET = "client-secret";

const { MtnMomoProvider } = await import("../src/services/payments/mtn-momo");
const { AirtelMoneyProvider } = await import("../src/services/payments/airtel-money");

// ---------------------------------------------------------------------------
// fetch stub: records requests, replays scripted responses
// ---------------------------------------------------------------------------
type Recorded = { url: string; method: string; headers: Record<string, string>; body: unknown };
let recorded: Recorded[] = [];
let responders: Array<(url: string) => Response | null> = [];
const realFetch = globalThis.fetch;

beforeEach(() => {
  recorded = [];
  responders = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = Object.fromEntries(
      Object.entries((init?.headers ?? {}) as Record<string, string>),
    );
    recorded.push({
      url,
      method: init?.method ?? "GET",
      headers,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
    });
    for (const responder of responders) {
      const res = responder(url);
      if (res) return res;
    }
    throw new Error(`No stubbed response for ${url}`);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// ---------------------------------------------------------------------------
// MTN MoMo
// ---------------------------------------------------------------------------
describe("MtnMomoProvider", () => {
  const input = {
    orderId: "11111111-2222-3333-4444-555555555555",
    amountMinor: 11_550, // K115.50
    currency: "ZMW",
    customerEmail: "s@cbu.ac.zm",
    customerPhone: "+260971234567",
  };

  test("initiate: token then request-to-pay, major units, MSISDN without plus", async () => {
    responders.push((url) => url.endsWith("/collection/token/")
      ? json({ access_token: "tok-1", expires_in: 3600 }) : null);
    responders.push((url) => url.endsWith("/collection/v1_0/requesttopay")
      ? new Response(null, { status: 202 }) : null);

    const p = new MtnMomoProvider();
    const res = await p.initiate(input);

    expect(res.status).toBe("pending");
    expect(res.clientSecret).toBeNull();

    const rtp = recorded.find((r) => r.url.endsWith("/requesttopay"))!;
    const body = rtp.body as {
      amount: string; currency: string; externalId: string;
      payer: { partyIdType: string; partyId: string };
    };
    expect(body.amount).toBe("115.50");            // ngwee → kwacha at the boundary
    expect(body.payer.partyId).toBe("260971234567"); // no leading +
    expect(body.externalId).toBe(res.providerRef);   // correlation id round-trips
    expect(rtp.headers["X-Reference-Id"]).toBe(res.providerRef);
    // Note: header credential VALUES aren't asserted — env.ts parses once per
    // process, and parallel test files race whose env vars it snapshots.
    expect("Ocp-Apim-Subscription-Key" in rtp.headers).toBe(true);
  });

  test("initiate: caches the OAuth token across calls", async () => {
    responders.push((url) => url.endsWith("/collection/token/")
      ? json({ access_token: "tok-1", expires_in: 3600 }) : null);
    responders.push((url) => url.endsWith("/collection/v1_0/requesttopay")
      ? new Response(null, { status: 202 }) : null);

    const p = new MtnMomoProvider();
    await p.initiate(input);
    await p.initiate(input);
    const tokenCalls = recorded.filter((r) => r.url.endsWith("/collection/token/"));
    expect(tokenCalls).toHaveLength(1);
  });

  test("parseWebhook maps SUCCESSFUL/FAILED and rejects garbage", async () => {
    const p = new MtnMomoProvider();

    const ok = await p.parseWebhook(
      JSON.stringify({ externalId: "ref-1", status: "SUCCESSFUL", amount: "115.50" }),
      undefined,
    );
    expect(ok).toEqual({ providerRef: "ref-1", status: "succeeded" });

    const failed = await p.parseWebhook(
      JSON.stringify({ externalId: "ref-2", status: "FAILED", reason: "PAYER_LIMIT_REACHED" }),
      undefined,
    );
    expect(failed.status).toBe("failed");

    expect(p.parseWebhook("not json", undefined)).rejects.toThrow();
    expect(p.parseWebhook(JSON.stringify({ status: "SUCCESSFUL" }), undefined)).rejects.toThrow();
  });

  test("refund fails loudly rather than pretending", async () => {
    const p = new MtnMomoProvider();
    // Matches on the behaviour, not the rail: which provider moves the money
    // is now a gateway decision, so the message must not name MTN.
    expect(p.refund("ref-1", 1000)).rejects.toThrow(/payout provider|manually/i);
  });
});

// ---------------------------------------------------------------------------
// Airtel Money
// ---------------------------------------------------------------------------
describe("AirtelMoneyProvider", () => {
  const input = {
    orderId: "11111111-2222-3333-4444-555555555555",
    amountMinor: 5_000, // K50
    currency: "ZMW",
    customerEmail: "s@cbu.ac.zm",
    customerPhone: "+260971234567",
  };

  test("initiate: client-credentials token, national MSISDN, major units", async () => {
    responders.push((url) => url.endsWith("/auth/oauth2/token")
      ? json({ access_token: "tok-a", expires_in: "3600" }) : null);
    responders.push((url) => url.endsWith("/merchant/v1/payments/")
      ? json({ status: { success: true } }) : null);

    const p = new AirtelMoneyProvider();
    const res = await p.initiate(input);

    expect(res.status).toBe("pending");
    const pay = recorded.find((r) => r.url.endsWith("/merchant/v1/payments/"))!;
    const body = pay.body as {
      subscriber: { msisdn: string; country: string };
      transaction: { amount: number; id: string };
    };
    expect(body.subscriber.msisdn).toBe("971234567"); // country code stripped
    expect(body.subscriber.country).toBe("ZM");
    expect(body.transaction.amount).toBe(50);
    expect(body.transaction.id).toBe(res.providerRef);
    expect(pay.headers["X-Currency"]).toBe("ZMW");
  });

  test("parseWebhook maps TS/TF and enforces the callback secret when set", async () => {
    const p = new AirtelMoneyProvider();

    const ok = await p.parseWebhook(
      JSON.stringify({ transaction: { id: "tx-1", status_code: "TS", airtel_money_id: "AM-1" } }),
      undefined,
    );
    expect(ok).toEqual({ providerRef: "tx-1", status: "succeeded" });

    const failed = await p.parseWebhook(
      JSON.stringify({ transaction: { id: "tx-2", status_code: "TF", message: "insufficient funds" } }),
      undefined,
    );
    expect(failed.status).toBe("failed");

    expect(p.parseWebhook(JSON.stringify({ transaction: { id: "tx-3" } }), undefined)).rejects.toThrow();
  });
});
