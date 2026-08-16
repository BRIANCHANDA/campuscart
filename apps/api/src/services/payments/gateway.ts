import type { PaymentMethod } from "@campuscart/shared";
import { env } from "../../env";
import { logger } from "../../lib/logger";
import { AirtelMoneyProvider } from "./airtel-money";
import { MtnMomoProvider } from "./mtn-momo";
import { MockPaymentProvider } from "./mock";
import { momoDisbursements } from "./momo-disbursements";
import { LencoProvider } from "./lenco";
import { lencoDisbursements } from "./lenco-disbursements";
import { NoopDisbursements, type DisbursementProvider } from "./disbursement";
import type { PaymentProvider } from "./provider";

/**
 * Payment gateway: routes each checkout to the wallet the customer chose
 * (Airtel Money or MTN MoMo). A provider is "live" once its keys are in the
 * environment; until then that method transparently falls back to the mock
 * (auto-approves) so local/dev and demos keep working. Deploying is therefore
 * just a matter of filling the keys in `.env` — no code changes.
 */

export const isAirtelConfigured = (): boolean =>
  Boolean(env.AIRTEL_CLIENT_ID && env.AIRTEL_CLIENT_SECRET);

export const isMomoConfigured = (): boolean =>
  Boolean(env.MOMO_SUBSCRIPTION_KEY && env.MOMO_API_USER && env.MOMO_API_KEY);

/** One key covers MTN, Airtel and Zamtel collections. */
export const isLencoConfigured = (): boolean => Boolean(env.LENCO_API_KEY);

const mock = new MockPaymentProvider();
const noopDisbursements = new NoopDisbursements();
// Providers hold cached tokens, so keep one instance each.
const airtel = new AirtelMoneyProvider();
const momo = new MtnMomoProvider();
const lencoMtn = new LencoProvider("mtn_momo");
const lencoAirtel = new LencoProvider("airtel_money");

/**
 * The live provider for a method, or the mock when its keys aren't set yet.
 *
 * Lenco wins when configured: it fronts every network through one integration,
 * so running it alongside a direct telco relationship would mean two paths to
 * the same wallet and two sets of webhooks settling the same payments.
 */
export function providerFor(method: PaymentMethod): PaymentProvider {
  switch (resolveCollectionRail(method, {
    lenco: isLencoConfigured(), airtel: isAirtelConfigured(), momo: isMomoConfigured(),
  })) {
    case "lenco": return method === "airtel_money" ? lencoAirtel : lencoMtn;
    case "airtel": return airtel;
    case "momo": return momo;
    default: return mock;
  }
}

export type ConfiguredRails = { lenco: boolean; airtel: boolean; momo: boolean };

/**
 * Which rail a set of configured credentials implies. Split out as a pure
 * function so the precedence — the part with real consequences — is testable
 * without mutating the shared parsed env that every suite in the process reads.
 */
export function resolveCollectionRail(
  method: PaymentMethod,
  configured: ConfiguredRails,
): "lenco" | "airtel" | "momo" | "mock" {
  if (configured.lenco) return "lenco";
  if (method === "airtel_money") return configured.airtel ? "airtel" : "mock";
  return configured.momo ? "momo" : "mock";
}

/** Payout counterpart of resolveCollectionRail. */
export function resolvePayoutRail(
  configured: { lenco: boolean; momo: boolean },
): "lenco" | "momo" | "none" {
  if (configured.lenco) return "lenco";
  if (configured.momo) return "momo";
  return "none";
}

/** True once real credentials exist for that wallet. */
export function isLive(method: PaymentMethod): boolean {
  if (isLencoConfigured()) return true;
  return method === "airtel_money" ? isAirtelConfigured() : isMomoConfigured();
}

/**
 * The rail courier payouts and refunds go out on.
 *
 * Lenco first: it reaches Airtel and Zamtel wallets as well as MTN, so a
 * courier's network stops being a payout constraint. MTN Disbursements remains
 * as a fallback for deployments still on the direct integration.
 */
export function disbursementProvider(): DisbursementProvider {
  switch (resolvePayoutRail({
    lenco: lencoDisbursements.isConfigured, momo: momoDisbursements.isConfigured,
  })) {
    case "lenco": return lencoDisbursements;
    case "momo": return momoDisbursements;
    default: return noopDisbursements;
  }
}

/**
 * Snapshot for health/status surfaces. This is the check used to confirm a
 * demo deployment cannot move real money, so it has to report Lenco too —
 * reporting only the direct integrations would show "mock" on a deployment
 * that is very much live.
 */
export function paymentStatus(): {
  airtelMoney: "live" | "mock";
  mtnMomo: "live" | "mock";
  via?: "lenco";
} {
  if (isLencoConfigured()) {
    return { airtelMoney: "live", mtnMomo: "live", via: "lenco" };
  }
  return {
    airtelMoney: isAirtelConfigured() ? ("live" as const) : ("mock" as const),
    mtnMomo: isMomoConfigured() ? ("live" as const) : ("mock" as const),
  };
}

logger.info("payments.gateway", paymentStatus());
