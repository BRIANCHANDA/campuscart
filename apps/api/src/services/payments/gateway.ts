import type { PaymentMethod } from "@campuscart/shared";
import { env } from "../../env";
import { logger } from "../../lib/logger";
import { AirtelMoneyProvider } from "./airtel-money";
import { MtnMomoProvider } from "./mtn-momo";
import { MockPaymentProvider } from "./mock";
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

const mock = new MockPaymentProvider();
// Providers hold cached tokens, so keep one instance each.
const airtel = new AirtelMoneyProvider();
const momo = new MtnMomoProvider();

/** The live provider for a method, or the mock when its keys aren't set yet. */
export function providerFor(method: PaymentMethod): PaymentProvider {
  if (method === "airtel_money") return isAirtelConfigured() ? airtel : mock;
  return isMomoConfigured() ? momo : mock;
}

/** True once real credentials exist for that wallet. */
export function isLive(method: PaymentMethod): boolean {
  return method === "airtel_money" ? isAirtelConfigured() : isMomoConfigured();
}

/** Snapshot for health/status surfaces. */
export function paymentStatus(): { airtelMoney: "live" | "mock"; mtnMomo: "live" | "mock" } {
  const status = {
    airtelMoney: isAirtelConfigured() ? ("live" as const) : ("mock" as const),
    mtnMomo: isMomoConfigured() ? ("live" as const) : ("mock" as const),
  };
  return status;
}

logger.info("payments.gateway", paymentStatus());
