import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createHash, createHmac } from "node:crypto";

process.env.DATABASE_URL ??=
  process.env.TEST_DATABASE_URL ?? "postgres://unit:unit@localhost:5432/unit";
process.env.JWT_SECRET ??= "unit-test-secret-0123456789abcdef!!";

/**
 * Config is injected rather than set through process.env: every suite shares
 * one process and one parsed `env`, so mutating it would race with any
 * concurrent suite calling providerFor().
 */
const TEST_KEY = "lenco-test-key";
const TEST_ACCOUNT = "b176cda5-7d97-4a3f-b4dd-ab0234e9e08c";
const CFG = { baseUrl: "https://api.lenco.test/access/v2", apiKey: TEST_KEY, feeBearer: "merchant" as const };
const TCFG = { baseUrl: "https://api.lenco.test/access/v2", apiKey: TEST_KEY, accountId: TEST_ACCOUNT };

const { LencoProvider, toNationalMsisdn, operatorFor } = await import("../src/services/payments/lenco");
const { LencoDisbursements, operatorFromPhone } = await import(
  "../src/services/payments/lenco-disbursements"
);
const { resolveCollectionRail, resolvePayoutRail } = await import(
  "../src/services/payments/gateway"
);

// ---------------------------------------------------------------------------
// fetch stub: records requests, replays scripted responses
// ---------------------------------------------------------------------------
type Recorded = { url: string; method: string; headers: Record<string, string>; body: any };
let recorded: Recorded[] = [];
let responders: Array<(url: string) => Response | null> = [];
const realFetch = globalThis.fetch;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  recorded = [];
  responders = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    recorded.push({
      url,
      method: init?.method ?? "GET",
      headers: Object.fromEntries(
        Object.entries((init?.headers ?? {}) as Record<string, string>),
      ),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
    });
    for (const responder of responders) {
      const res = responder(url);
      if (res) return res;
    }
    throw new Error(`unstubbed fetch: ${url}`);
  }) as typeof fetch;
});
afterEach(() => { globalThis.fetch = realFetch; });

const collectionOk = (reference: string, status = "pay-offline") =>
  json({
    status: true,
    message: "",
    data: {
      id: "e809a3de-3a9f-4a62-9e9b-077311a1924f",
      reference,
      lencoReference: "240730008",
      status,
      reasonForFailure: null,
      currency: "ZMW",
    },
  });

// ---------------------------------------------------------------------------
describe("Lenco boundary conversions", () => {
  test("MSISDN goes to national form — Lenco wants 0977…, we store +260977…", () => {
    expect(toNationalMsisdn("+260977433571")).toBe("0977433571");
    expect(toNationalMsisdn("260977433571")).toBe("0977433571");
    expect(toNationalMsisdn("0977433571")).toBe("0977433571");
    expect(toNationalMsisdn("+260 977 433 571")).toBe("0977433571");
  });

  test("payment method maps onto the operator Lenco expects", () => {
    expect(operatorFor("airtel_money")).toBe("airtel");
    expect(operatorFor("mtn_momo")).toBe("mtn");
  });
});

describe("LencoProvider — collections", () => {
  test("initiate sends major units, national MSISDN and the right operator", async () => {
    responders.push((url) => (url.includes("/collections/mobile-money")
      ? collectionOk("will-be-overwritten") : null));

    const p = new LencoProvider("airtel_money", CFG);
    await p.initiate({
      orderId: "11111111-2222-3333-4444-555555555555",
      amountMinor: 4500, // K45.00
      currency: "ZMW",
      customerEmail: "shopper@example.test",
      customerPhone: "+260977433571",
    });

    const req = recorded.at(-1)!;
    expect(req.method).toBe("POST");
    expect(req.headers.Authorization).toBe("Bearer lenco-test-key");
    // The single most expensive mistake available here is a 100x amount error.
    expect(req.body.amount).toBe(45);
    expect(req.body.phone).toBe("0977433571");
    expect(req.body.operator).toBe("airtel");
    expect(req.body.country).toBe("zm");
    expect(req.body.bearer).toBe("merchant");
    expect(req.body.reference).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  test("providerRef is our reference, so the webhook can correlate", async () => {
    let sentReference = "";
    responders.push((url) => {
      if (!url.includes("/collections/mobile-money")) return null;
      sentReference = recorded.at(-1)!.body.reference;
      return collectionOk(sentReference);
    });

    const p = new LencoProvider("mtn_momo", CFG);
    const out = await p.initiate({
      orderId: "o-1", amountMinor: 1000, currency: "ZMW",
      customerEmail: "a@b.test", customerPhone: "+260966000000",
    });

    expect(out.providerRef).toBe(sentReference);
    expect(out.status).toBe("pending"); // pay-offline = waiting on the handset
    expect(out.clientSecret).toBeNull();
  });

  test("a declined collection throws rather than returning a pending payment", async () => {
    responders.push((url) => (url.includes("/collections/mobile-money")
      ? collectionOk("ref-x", "failed") : null));

    const p = new LencoProvider("mtn_momo", CFG);
    expect(p.initiate({
      orderId: "o-2", amountMinor: 1000, currency: "ZMW",
      customerEmail: "a@b.test", customerPhone: "+260966000000",
    })).rejects.toThrow();
  });

  test("an HTTP error surfaces as a provider error, not a silent pending", async () => {
    responders.push((url) => (url.includes("/collections/mobile-money")
      ? json({ status: false, message: "insufficient balance" }, 400) : null));

    const p = new LencoProvider("mtn_momo", CFG);
    expect(p.initiate({
      orderId: "o-3", amountMinor: 1000, currency: "ZMW",
      customerEmail: "a@b.test", customerPhone: "+260966000000",
    })).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
const sign = (raw: string, key = "lenco-test-key"): string =>
  createHmac("sha512", createHash("sha256").update(key).digest()).update(raw).digest("hex");

describe("LencoProvider — webhook", () => {
  const p = new LencoProvider("mtn_momo", CFG);

  test("a correctly signed success settles the referenced payment", async () => {
    const raw = JSON.stringify({
      event: "collection.successful",
      data: { reference: "ref-1", status: "successful" },
    });
    const out = await p.parseWebhook(raw, sign(raw));
    expect(out).toEqual({ providerRef: "ref-1", status: "succeeded" });
  });

  test("failure events map to failed", async () => {
    const raw = JSON.stringify({
      event: "collection.failed",
      data: { reference: "ref-2", status: "failed" },
    });
    expect(await p.parseWebhook(raw, sign(raw))).toEqual({
      providerRef: "ref-2", status: "failed",
    });
  });

  test("a tampered body is rejected", async () => {
    const raw = JSON.stringify({
      event: "collection.successful",
      data: { reference: "ref-3", status: "successful" },
    });
    const signature = sign(raw);
    const tampered = raw.replace("ref-3", "ref-4");
    expect(p.parseWebhook(tampered, signature)).rejects.toThrow(/signature/i);
  });

  test("a signature from the wrong key is rejected", async () => {
    const raw = JSON.stringify({
      event: "collection.successful",
      data: { reference: "ref-5", status: "successful" },
    });
    expect(p.parseWebhook(raw, sign(raw, "someone-elses-key"))).rejects.toThrow(/signature/i);
  });

  test("a missing signature is rejected", async () => {
    const raw = JSON.stringify({ event: "collection.successful", data: { reference: "r" } });
    expect(p.parseWebhook(raw, undefined)).rejects.toThrow(/signature/i);
  });

  test("collection.settled is not treated as a payment state change", async () => {
    // It reports OUR account being credited, well after the customer paid.
    const raw = JSON.stringify({
      event: "collection.settled",
      data: { reference: "ref-6", status: "successful" },
    });
    expect(p.parseWebhook(raw, sign(raw))).rejects.toThrow(/Unhandled/i);
  });

  test("garbage is rejected even when correctly signed", async () => {
    const raw = "not json at all";
    expect(p.parseWebhook(raw, sign(raw))).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
describe("LencoDisbursements — courier payouts", () => {
  test("operator is inferred from the courier's number", () => {
    expect(operatorFromPhone("+260966123456")).toBe("mtn");
    expect(operatorFromPhone("+260977123456")).toBe("airtel");
    expect(operatorFromPhone("+260955123456")).toBe("zamtel");
    expect(operatorFromPhone("+260901123456")).toBeNull();
  });

  test("transfer debits the configured account, in major units", async () => {
    responders.push((url) => (url.includes("/transfers/mobile-money")
      ? json({
        status: true, message: "",
        data: { id: "t-1", reference: "r-1", lencoReference: "240010002", status: "successful", reasonForFailure: null },
      }) : null));

    const d = new LencoDisbursements(TCFG);
    const ref = await d.transfer({
      amountMinor: 24500, // K245.00
      currency: "ZMW",
      payeePhone: "+260966123456",
      note: "CampusCart payout (7 deliveries)",
    });

    const req = recorded.at(-1)!;
    expect(req.body.accountId).toBe("b176cda5-7d97-4a3f-b4dd-ab0234e9e08c");
    expect(req.body.amount).toBe(245);
    expect(req.body.phone).toBe("0966123456");
    expect(req.body.operator).toBe("mtn");
    expect(req.body.reference).toBe(ref);
  });

  test("a caller-supplied reference is reused, so a retry cannot double-pay", async () => {
    responders.push((url) => (url.includes("/transfers/mobile-money")
      ? json({
        status: true, message: "",
        data: { id: "t-2", reference: "retry-me", lencoReference: null, status: "pending", reasonForFailure: null },
      }) : null));

    const d = new LencoDisbursements(TCFG);
    const ref = await d.transfer({
      amountMinor: 1000, currency: "ZMW", payeePhone: "+260977000000",
      note: "retry", referenceId: "retry-me",
    });
    expect(ref).toBe("retry-me");
    expect(recorded.at(-1)!.body.reference).toBe("retry-me");
  });

  test("an unrecognised network stops the payout instead of guessing", async () => {
    const d = new LencoDisbursements(TCFG);
    expect(d.transfer({
      amountMinor: 1000, currency: "ZMW", payeePhone: "+260901234567", note: "x",
    })).rejects.toThrow(/network/i);
    expect(recorded).toHaveLength(0); // never reached the API
  });

  test("a declined transfer throws rather than reporting a settled payout", async () => {
    responders.push((url) => (url.includes("/transfers/mobile-money")
      ? json({
        status: true, message: "",
        data: { id: "t-3", reference: "r-3", lencoReference: null, status: "failed", reasonForFailure: "insufficient funds" },
      }) : null));

    const d = new LencoDisbursements(TCFG);
    expect(d.transfer({
      amountMinor: 1000, currency: "ZMW", payeePhone: "+260966000000", note: "x",
    })).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
describe("gateway precedence", () => {
  test("Lenco wins for both wallets once configured, even alongside the telcos", () => {
    // Running both would mean two integrations reaching the same wallet and
    // two webhooks settling the same payment.
    const all = { lenco: true, airtel: true, momo: true };
    expect(resolveCollectionRail("mtn_momo", all)).toBe("lenco");
    expect(resolveCollectionRail("airtel_money", all)).toBe("lenco");
  });

  test("without Lenco it falls back per wallet, then to the mock", () => {
    const direct = { lenco: false, airtel: true, momo: true };
    expect(resolveCollectionRail("airtel_money", direct)).toBe("airtel");
    expect(resolveCollectionRail("mtn_momo", direct)).toBe("momo");

    const none = { lenco: false, airtel: false, momo: false };
    expect(resolveCollectionRail("airtel_money", none)).toBe("mock");
    expect(resolveCollectionRail("mtn_momo", none)).toBe("mock");
  });

  test("payouts prefer Lenco, which reaches Airtel and Zamtel as well as MTN", () => {
    expect(resolvePayoutRail({ lenco: true, momo: true })).toBe("lenco");
    expect(resolvePayoutRail({ lenco: false, momo: true })).toBe("momo");
    expect(resolvePayoutRail({ lenco: false, momo: false })).toBe("none");
  });
});
