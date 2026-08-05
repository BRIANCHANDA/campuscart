import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { apiReference } from "@scalar/hono-api-reference";
import { errorResponse } from "./lib/errors";
import { logger } from "./lib/logger";
import { paymentStatus } from "./services/payments/gateway";
import { authRoutes } from "./routes/auth";
import { cartRoutes } from "./routes/cart";
import { checkoutRoutes } from "./routes/checkout";
import { courierRoutes } from "./routes/courier";
import { orderRoutes } from "./routes/orders";
import { platformAdminRoutes } from "./routes/platform-admin";
import { productRoutes } from "./routes/products";
import { shopAdminRoutes } from "./routes/shop-admin";
import { shopRoutes } from "./routes/shops";
import { uploadRoutes } from "./routes/uploads";
import { webhookRoutes } from "./routes/webhooks";
import { wsHandler } from "./routes/ws";

export function buildApp() {
  const app = new OpenAPIHono({
    // Zod validation failures → the shared error shape
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid request", details: result.error.flatten() } },
          400,
        );
      }
    },
  });

  app.onError((err, c) => errorResponse(c, err));

  // Web admin console + expo web run on other origins; API is token-auth'd.
  app.use("*", cors({ origin: (o) => o, allowHeaders: ["Authorization", "Content-Type", "Idempotency-Key"] }));

  app.use("*", async (c, next) => {
    const started = Date.now();
    await next();
    logger.info("http", {
      method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - started,
    });
  });

  app.get("/health", (c) => c.json({ ok: true, payments: paymentStatus() }));

  // Which mobile-money wallets shoppers can pay with. Both are always offered;
  // `live` reflects whether real keys are configured (false → mock auto-approve).
  app.get("/payments/methods", (c) =>
    c.json({
      methods: [
        { method: "airtel_money", label: "Airtel Money", live: paymentStatus().airtelMoney === "live" },
        { method: "mtn_momo", label: "MTN MoMo", live: paymentStatus().mtnMomo === "live" },
      ],
    }),
  );

  app.route("/auth", authRoutes);
  app.route("/shops", shopRoutes);
  app.route("/products", productRoutes);
  app.route("/cart", cartRoutes);
  app.route("/checkout", checkoutRoutes);
  app.route("/orders", orderRoutes);
  app.route("/admin/shops", shopAdminRoutes);
  app.route("/courier", courierRoutes);
  app.route("/platform", platformAdminRoutes);
  app.route("/uploads", uploadRoutes);
  app.route("/webhooks", webhookRoutes);
  app.get("/ws", wsHandler);

  // OpenAPI spec generated from the Zod route definitions — always in sync with code
  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: { title: "CampusCart API", version: "0.1.0" },
  });
  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http", scheme: "bearer", bearerFormat: "JWT",
  });
  app.get("/docs", apiReference({ spec: { url: "/openapi.json" }, theme: "kepler" }));

  return app;
}
