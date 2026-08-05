import { buildApp } from "./app";
import { env } from "./env";
import { logger } from "./lib/logger";
import { isAirtelConfigured, isMomoConfigured } from "./services/payments/gateway";
import { websocket } from "./routes/ws";

const app = buildApp();

/**
 * Deployment guardrails. In production a few misconfigurations are dangerous
 * enough to refuse to boot (weak JWT secret); others are logged loudly so
 * they're impossible to miss (no real payment provider → mock money).
 */
function preflight(): void {
  const isProd = process.env.NODE_ENV === "production";
  const weakSecret = env.JWT_SECRET.includes("change-me") || env.JWT_SECRET.length < 32;

  if (isProd && weakSecret) {
    logger.error("config.fatal", { reason: "JWT_SECRET is the default/placeholder — refusing to start" });
    process.exit(1);
  }
  if (weakSecret) logger.warn("config.warn", { reason: "JWT_SECRET is weak/placeholder — set a strong one before deploying" });

  const airtel = isAirtelConfigured();
  const momo = isMomoConfigured();
  if (!airtel && !momo) {
    logger[isProd ? "error" : "warn"]("config.warn", {
      reason: "No live mobile-money provider configured — checkout uses MOCK payments",
    });
  } else {
    logger.info("config.payments", { airtelMoney: airtel ? "live" : "mock", mtnMomo: momo ? "live" : "mock" });
  }
  if (!env.YANGO_API_KEY) logger.warn("config.warn", { reason: "Yango not configured — deliveries use the mock provider" });
}

preflight();

logger.info("server.start", {
  port: env.PORT,
  docs: `http://localhost:${env.PORT}/docs`,
  ws: `ws://localhost:${env.PORT}/ws`,
});

export default {
  port: env.PORT,
  fetch: app.fetch,
  websocket, // realtime gateway upgrade handler
};
